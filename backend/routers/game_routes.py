from fastapi import APIRouter, HTTPException
from backend.types.game_types import Move
from backend.dependencies import get_game
from backend.types.api_types import ModeChangeInput

router = APIRouter()
game = get_game()


def game_state():
    return {
        "board": game._get_obs(),
        "done": game.terminated,
        "winner": game.winner,
        "current_player": game.current_player,
    }


@router.post("/move")
async def make_move(move: Move):
    if game.terminated:
        raise HTTPException(status_code=400, detail="The game is over. Reset the game to play again.")
    if game.check_if_ai_move():
        raise HTTPException(status_code=400, detail="It is not a human player's turn.")
    if not game._is_valid_action(move.column):
        raise HTTPException(status_code=400, detail="Invalid action, column full.")
    _, reward, _, _ = await game.play_turn(move.column)
    return {**game_state(), "reward": reward}


@router.post("/reset")
async def reset_game():
    await game.reset_and_start()
    return game_state()


@router.get("/state")
async def get_state():
    return game_state()


@router.post("/set_mode")
async def set_mode(mode_change_input: ModeChangeInput):
    try:
        await game.set_mode(mode_change_input.player, mode_change_input.mode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return game_state()
