from databases import Database
import os

from backend.game_store import MemoryGameStore, PostgresGameStore

# Database URL from environment variable or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase")
database = Database(DATABASE_URL)

# "postgres" (default) keeps games in the database so they survive restarts
# and work with several backend processes; "memory" needs no database.
GAME_STORE = os.getenv("GAME_STORE", "postgres")
if GAME_STORE not in ("postgres", "memory"):
    raise ValueError(f"GAME_STORE must be 'postgres' or 'memory', not {GAME_STORE!r}")

_game_store = PostgresGameStore(database) if GAME_STORE == "postgres" else MemoryGameStore()


def get_game_store():
    return _game_store


def set_game_store(store):
    """Swap the game store (used by tests)."""
    global _game_store
    _game_store = store


def get_database() -> Database:
    """Dependency function to get the database instance."""
    return database
