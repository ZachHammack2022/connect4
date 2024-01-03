from backend.types.db_types import GameResult
from backend.dependencies import get_game, get_database
from fastapi import APIRouter
from fastapi import HTTPException
import logging


router = APIRouter()
game = get_game()
database = get_database()

@router.post("/submit_game/")
async def submit_game(result: GameResult):
    try:
        user_exists_query = "SELECT EXISTS(SELECT 1 FROM games WHERE username = :username)"
        user_exists_result = await database.fetch_one(user_exists_query, {"username": result.username})
        
        user_exists = user_exists_result[0]  # Adjust depending on how your database driver returns the result

        if user_exists:
            if result.won:
                update_query = "UPDATE games SET wins = wins + 1 WHERE username = :username"
            else:
                update_query = "UPDATE games SET losses = losses + 1 WHERE username = :username"
            await database.execute(update_query, {"username": result.username})
        else:
            wins = 1 if result.won else 0
            losses = 0 if result.won else 1
            insert_query = "INSERT INTO games (username, wins, losses) VALUES (:username, :wins, :losses)"
            await database.execute(insert_query, {"username": result.username, "wins": wins, "losses": losses})

        return {"message": "Game result saved"}
    except Exception as e:
        logging.error(f"Error in submit_game: {e}")
        raise HTTPException(status_code=500, detail="Error processing game result")


@router.get("/leaderboard/")
async def get_leaderboard():
    try:
        query = "SELECT username, wins, losses FROM games ORDER BY wins DESC"
        return await database.fetch_all(query)
    except Exception as e:
        logging.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Error fetching leaderboard")
