from backend.types.db_types import GameResult
from backend.dependencies import get_database
from fastapi import APIRouter
from fastapi import HTTPException
import logging


router = APIRouter()
database = get_database()

@router.post("/submit_game/")
async def submit_game(result: GameResult):
    try:
        # Single atomic upsert: no race between checking for and creating the user.
        query = """
            INSERT INTO games (username, wins, losses) VALUES (:username, :wins, :losses)
            ON CONFLICT (username) DO UPDATE
            SET wins = games.wins + EXCLUDED.wins, losses = games.losses + EXCLUDED.losses
        """
        wins = 1 if result.won else 0
        await database.execute(query, {"username": result.username, "wins": wins, "losses": 1 - wins})
        return {"message": "Game result saved"}
    except Exception as e:
        logging.error(f"Error in submit_game: {e}")
        raise HTTPException(status_code=500, detail="Error processing game result")


@router.get("/leaderboard/")
async def get_leaderboard():
    try:
        query = "SELECT username, wins, losses FROM games ORDER BY wins DESC, losses ASC"
        return await database.fetch_all(query)
    except Exception as e:
        logging.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Error fetching leaderboard")
