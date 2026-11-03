import logging

from fastapi import APIRouter, HTTPException, Query

from backend.dependencies import get_database
from backend.game.registry import GAME_TYPES, DEFAULT_GAME_TYPE
from backend.types.db_types import GameResult

router = APIRouter()
database = get_database()


@router.post("/submit_game/")
async def submit_game(result: GameResult):
    try:
        # Single atomic upsert: no race between checking for and creating the user.
        query = """
            INSERT INTO games (username, game_type, wins, losses, draws)
            VALUES (:username, :game_type, :wins, :losses, :draws)
            ON CONFLICT (username, game_type) DO UPDATE
            SET wins = games.wins + EXCLUDED.wins,
                losses = games.losses + EXCLUDED.losses,
                draws = games.draws + EXCLUDED.draws
        """
        await database.execute(query, {
            "username": result.username,
            "game_type": result.game_type,
            "wins": int(result.outcome == "win"),
            "losses": int(result.outcome == "loss"),
            "draws": int(result.outcome == "draw"),
        })
        return {"message": "Game result saved"}
    except Exception as e:
        logging.error(f"Error in submit_game: {e}")
        raise HTTPException(status_code=500, detail="Error processing game result")


@router.get("/leaderboard/")
async def get_leaderboard(game_type: str = Query(DEFAULT_GAME_TYPE)):
    if game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown game type: {game_type}")
    try:
        query = """
            SELECT username, wins, losses, draws FROM games
            WHERE game_type = :game_type
            ORDER BY wins DESC, losses ASC, draws DESC
        """
        return await database.fetch_all(query, {"game_type": game_type})
    except Exception as e:
        logging.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Error fetching leaderboard")
