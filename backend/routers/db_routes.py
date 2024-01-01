from backend.types.db_types import GameResult
from ..dependencies import get_game, get_database
from fastapi import APIRouter
from dependencies import get_game
router = APIRouter()

game = get_game()
database = get_database()

@router.post("/submit_game/")
async def submit_game(result: GameResult):
    # Check if the user already exists in the database
    user_exists_query = "SELECT EXISTS(SELECT 1 FROM games WHERE username = :username)"
    user_exists = await database.fetch_one(user_exists_query, {"username": result.username})

    if user_exists:
        # User exists, update their record
        if result.won:
            update_query = "UPDATE games SET wins = wins + 1 WHERE username = :username"
        else:
            update_query = "UPDATE games SET losses = losses + 1 WHERE username = :username"
        await database.execute(update_query, {"username": result.username})
    else:
        # User does not exist, create a new record
        insert_query = "INSERT INTO games (username, wins, losses) VALUES (:username, :wins, :losses)"
        wins = 1 if result.won else 0
        losses = 0 if result.won else 1
        await database.execute(insert_query, {"username": result.username, "wins": wins, "losses": losses})

    return {"message": "Game result saved"}

@router.get("/leaderboard/")
async def get_leaderboard():
    query = "SELECT username, wins, losses FROM games ORDER BY wins DESC"
    return await database.fetch_all(query)
