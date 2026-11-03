import asyncio
import time
import uuid
from collections import OrderedDict
from dataclasses import dataclass, field

from backend.game.game import Connect4Env


@dataclass
class GameSession:
    game: Connect4Env
    # Serialises requests for one game so moves from overlapping requests
    # (double clicks, multiple tabs) can't interleave.
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    last_used: float = field(default_factory=time.monotonic)


class GameStore:
    """In-memory games keyed by id, with idle expiry and a size cap."""

    def __init__(self, max_games: int = 1000, idle_timeout: float = 60 * 60):
        self.max_games = max_games
        self.idle_timeout = idle_timeout
        self._sessions: "OrderedDict[str, GameSession]" = OrderedDict()

    def __len__(self):
        return len(self._sessions)

    def create(self) -> tuple[str, GameSession]:
        self._evict(make_room=True)
        game_id = uuid.uuid4().hex
        session = GameSession(Connect4Env())
        self._sessions[game_id] = session
        return game_id, session

    def get(self, game_id: str) -> GameSession:
        """Return the session, raising KeyError if it is unknown or expired."""
        self._evict()
        session = self._sessions[game_id]
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
