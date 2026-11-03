from contextlib import asynccontextmanager

from fastapi import APIRouter, HTTPException
from backend.types.game_types import Move
from backend.types.api_types import ModeChangeInput
from backend.dependencies import get_game_store
from backend.game_store import GameNotFound
from backend.game.game import Connect4Env

router = APIRouter(prefix="/games")


def game_state(game_id: str, game: Connect4Env):
    return {
        "game_id": game_id,
        "board": game._get_obs(),
        "done": game.terminated,
        "winner": game.winner,
        "current_player": game.current_player,
        "mode1": game.player1.name,
        "mode2": game.player2.name,
        "difficulty1": game.player1.difficulty,
        "difficulty2": game.player2.difficulty,
        "winning_cells": game.winning_cells,
    }


@asynccontextmanager
async def open_game(game_id: str):
    """Exclusive access to a game for the rest of the request; 404 if unknown."""
    try:
        async with get_game_store().open(game_id) as game:
            yield game
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found. It may have expired; start a new game.")


@router.post("")
async def create_game():
    game_id, game = await get_game_store().create()
    return game_state(game_id, game)


@router.get("/{game_id}")
async def get_state(game_id: str):
    async with open_game(game_id) as game:
        return game_state(game_id, game)


@router.post("/{game_id}/move")
async def make_move(game_id: str, move: Move):
    async with open_game(game_id) as game:
        if game.terminated:
            raise HTTPException(status_code=400, detail="The game is over. Reset the game to play again.")
        if game.check_if_ai_move():
            raise HTTPException(status_code=400, detail="It is not a human player's turn.")
        if not game._is_valid_action(move.column):
            raise HTTPException(status_code=400, detail="Invalid action, column full.")
        await game.play_turn(move.column)
        return game_state(game_id, game)


@router.post("/{game_id}/reset")
async def reset_game(game_id: str):
    async with open_game(game_id) as game:
        await game.reset_and_start()
        return game_state(game_id, game)


@router.post("/{game_id}/mode")
async def set_mode(game_id: str, mode_change_input: ModeChangeInput):
    async with open_game(game_id) as game:
        try:
            await game.set_mode(mode_change_input.player, mode_change_input.mode, mode_change_input.difficulty)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return game_state(game_id, game)
