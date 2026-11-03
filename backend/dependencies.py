from databases import Database
from fastapi import HTTPException
import os

from backend.game_store import GameStore, GameSession

game_store = GameStore()

# Database URL from environment variable or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase")
database = Database(DATABASE_URL)


def get_game_store() -> GameStore:
    return game_store


def get_game_session(game_id: str) -> GameSession:
    """Dependency resolving the `game_id` path parameter to its game."""
    try:
        return game_store.get(game_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Game not found. It may have expired; start a new game.")


def get_database() -> Database:
    """Dependency function to get the database instance."""
    return database
