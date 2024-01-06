from game.game import Connect4Env
from databases import Database
import os

# Initialize the Connect4Env game instance
game = Connect4Env()

# Database URL from environment variable or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydatabase")
database = Database(DATABASE_URL)

def get_game() -> Connect4Env:
    """Dependency function to get the game instance."""
    return game

def get_database() -> Database:
    """Dependency function to get the database instance."""
    return database
