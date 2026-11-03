import logging

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.dependencies import get_database
from backend.game.registry import GAME_TYPES, DEFAULT_GAME_TYPE
from backend.types.db_types import GameResult

router = APIRouter()
database = get_database()


@router.post("/submit_game/")
async def submit_game(result: GameResult):
    win = int(result.outcome == "win")
    try:
        async with database.transaction():
            # Single atomic upsert: no race between checking for and creating
            # the user. A win extends the streak; anything else ends it.
            await database.execute("""
                INSERT INTO games (username, game_type, wins, losses, draws, current_streak, best_streak)
                VALUES (:username, :game_type, :wins, :losses, :draws, :wins, :wins)
                ON CONFLICT (username, game_type) DO UPDATE
                SET wins = games.wins + EXCLUDED.wins,
                    losses = games.losses + EXCLUDED.losses,
                    draws = games.draws + EXCLUDED.draws,
                    current_streak = CASE WHEN EXCLUDED.wins = 1 THEN games.current_streak + 1 ELSE 0 END,
                    best_streak = GREATEST(games.best_streak,
                        CASE WHEN EXCLUDED.wins = 1 THEN games.current_streak + 1 ELSE 0 END)
            """, {
                "username": result.username,
                "game_type": result.game_type,
                "wins": win,
                "losses": int(result.outcome == "loss"),
                "draws": int(result.outcome == "draw"),
            })
            if result.opponent:
                await database.execute("""
                    INSERT INTO game_results (username, game_type, opponent, difficulty, outcome)
                    VALUES (:username, :game_type, :opponent, :difficulty, :outcome)
                """, {
                    "username": result.username,
                    "game_type": result.game_type,
                    "opponent": result.opponent,
                    "difficulty": result.difficulty,
                    "outcome": result.outcome,
                })
        return {"message": "Game result saved"}
    except Exception as e:
        logging.error(f"Error in submit_game: {e}")
        raise HTTPException(status_code=500, detail="Error processing game result")


def check_game_type(game_type: str):
    if game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown game type: {game_type}")


@router.get("/leaderboard/")
async def get_leaderboard(
    game_type: str = Query(DEFAULT_GAME_TYPE),
    opponent: Optional[str] = Query(None, description="Only results against this AI mode"),
    difficulty: Optional[str] = Query(None, description="...at this difficulty"),
):
    check_game_type(game_type)
    try:
        if opponent is None:
            query = """
                SELECT username, wins, losses, draws, current_streak, best_streak FROM games
                WHERE game_type = :game_type
                ORDER BY wins DESC, losses ASC, draws DESC
            """
            return await database.fetch_all(query, {"game_type": game_type})
        # Per-opponent tallies; streaks are each player's overall ones for the game.
        query = """
            SELECT r.username,
                   COUNT(*) FILTER (WHERE r.outcome = 'win') AS wins,
                   COUNT(*) FILTER (WHERE r.outcome = 'loss') AS losses,
                   COUNT(*) FILTER (WHERE r.outcome = 'draw') AS draws,
                   COALESCE(MAX(g.current_streak), 0) AS current_streak,
                   COALESCE(MAX(g.best_streak), 0) AS best_streak
            FROM game_results r
            LEFT JOIN games g ON g.username = r.username AND g.game_type = r.game_type
            WHERE r.game_type = :game_type AND r.opponent = :opponent
              AND r.difficulty IS NOT DISTINCT FROM :difficulty
            GROUP BY r.username
            ORDER BY wins DESC, losses ASC, draws DESC
        """
        return await database.fetch_all(query, {"game_type": game_type, "opponent": opponent, "difficulty": difficulty})
    except Exception as e:
        logging.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Error fetching leaderboard")


@router.get("/leaderboard/opponents")
async def get_leaderboard_opponents(game_type: str = Query(DEFAULT_GAME_TYPE)):
    """The AI opponents (and difficulties) that have results, for filtering."""
    check_game_type(game_type)
    rows = await database.fetch_all("""
        SELECT opponent, difficulty, COUNT(*) AS games FROM game_results
        WHERE game_type = :game_type
        GROUP BY opponent, difficulty
        ORDER BY opponent, CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 ELSE 0 END
    """, {"game_type": game_type})
    return [dict(row._mapping) for row in rows]
