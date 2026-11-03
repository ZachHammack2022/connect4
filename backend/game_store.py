"""Where games live between requests.

Both stores share one interface:

    game_id, game = await store.create()
    async with store.open(game_id) as game:   # raises GameNotFound
        ...                                    # exclusive access; saved on exit

PostgresGameStore is the default: games survive restarts and several backend
processes can serve the same game. MemoryGameStore needs no database and is
used by the tests (set GAME_STORE=memory to use it when running the app).
"""
import asyncio
import json
import time
import uuid
from collections import OrderedDict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import AsyncIterator

from databases import Database

from backend.game.game import Connect4Env


class GameNotFound(KeyError):
    pass


# ---- in memory -----------------------------------------------------------

@dataclass
class GameSession:
    game: Connect4Env
    # Serialises requests for one game so moves from overlapping requests
    # (double clicks, multiple tabs) can't interleave.
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    last_used: float = field(default_factory=time.monotonic)


class MemoryGameStore:
    """In-memory games keyed by id, with idle expiry and a size cap."""

    def __init__(self, max_games: int = 1000, idle_timeout: float = 60 * 60):
        self.max_games = max_games
        self.idle_timeout = idle_timeout
        self._sessions: "OrderedDict[str, GameSession]" = OrderedDict()

    def __len__(self):
        return len(self._sessions)

    async def create(self) -> tuple[str, Connect4Env]:
        self._evict(make_room=True)
        game_id = uuid.uuid4().hex
        session = GameSession(Connect4Env())
        self._sessions[game_id] = session
        return game_id, session.game

    @asynccontextmanager
    async def open(self, game_id: str) -> AsyncIterator[Connect4Env]:
        session = self._get(game_id)
        async with session.lock:
            yield session.game

    def _get(self, game_id: str) -> GameSession:
        self._evict()
        try:
            session = self._sessions[game_id]
        except KeyError:
            raise GameNotFound(game_id)
        session.last_used = time.monotonic()
        self._sessions.move_to_end(game_id)  # keep least-recently-used first
        return session

    def _evict(self, make_room: bool = False):
        cutoff = time.monotonic() - self.idle_timeout
        while self._sessions:
            oldest_id, oldest = next(iter(self._sessions.items()))
            # Drop idle games, and when making room for a new game, the least
            # recently used ones. A game whose lock is held is mid-request.
            too_many = make_room and len(self._sessions) >= self.max_games
            if (oldest.last_used < cutoff or too_many) and not oldest.lock.locked():
                del self._sessions[oldest_id]
            else:
                break


# ---- Postgres ------------------------------------------------------------

GAME_SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS game_sessions_updated_at ON game_sessions (updated_at)",
]


class PostgresGameStore:
    """Games stored as JSON rows. Each request locks its game's row
    (SELECT ... FOR UPDATE) for the duration of the request, so concurrent
    requests for one game run one at a time, even across processes."""

    def __init__(self, database: Database, idle_timeout_hours: int = 24):
        self.database = database
        self.idle_timeout_hours = idle_timeout_hours

    async def create(self) -> tuple[str, Connect4Env]:
        # Clean up abandoned games as new ones are started.
        await self.database.execute(
            "DELETE FROM game_sessions WHERE updated_at < now() - make_interval(hours => :hours)",
            {"hours": self.idle_timeout_hours},
        )
        game_id = uuid.uuid4().hex
        game = Connect4Env()
        await self.database.execute(
            "INSERT INTO game_sessions (id, state) VALUES (:id, CAST(:state AS JSONB))",
            {"id": game_id, "state": json.dumps(game.to_dict())},
        )
        return game_id, game

    @asynccontextmanager
    async def open(self, game_id: str) -> AsyncIterator[Connect4Env]:
        async with self.database.transaction():
            row = await self.database.fetch_one(
                "SELECT state FROM game_sessions WHERE id = :id FOR UPDATE", {"id": game_id}
            )
            if row is None:
                raise GameNotFound(game_id)
            state = row["state"]
            game = Connect4Env.from_dict(json.loads(state) if isinstance(state, str) else state)
            yield game
            # Only reached if the request didn't raise; an error rolls back.
            await self.database.execute(
                "UPDATE game_sessions SET state = CAST(:state AS JSONB), updated_at = now() WHERE id = :id",
                {"id": game_id, "state": json.dumps(game.to_dict())},
            )


async def ensure_game_schema(database: Database) -> None:
    for statement in GAME_SCHEMA_STATEMENTS:
        await database.execute(statement)
