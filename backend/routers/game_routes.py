from fastapi import APIRouter, HTTPException, Depends
from backend.types.game_types import Move,Mode
from game.game import Connect4Env
from backend.dependencies import get_game
from fastapi import Body, Query
from backend.types.api_types import ModeChangeInput

router = APIRouter()
game = get_game()

@router.post("/move")
async def make_move(move: Move):
    if not game._is_valid_action(move.column):
        raise HTTPException(status_code=400, detail="Invalid action, column full.")
    if game.terminated:
        return {"board": game._get_obs()[1:], "reward": 0, "done": True, "winner": game.winner}
    _, reward, terminated, _ = await game.play_turn(move.column)
    print(len(game._get_obs()))
    return {"board": game._get_obs(), "reward": reward, "done": terminated,"winner": game.winner, "current_player": game.current_player}

@router.post("/reset")
async def reset_game():
    game.reset()
    print(game._get_obs())
    return {"board": game._get_obs(), "current_player": game.current_player}

@router.get("/state")
async def get_state():
    return {"board": game._get_obs(), "current_player": game.current_player}

@router.post("/set_mode")
async def set_mode(mode_change_input: ModeChangeInput):
    try:
        game.set_mode(mode_change_input.player, mode_change_input.mode)
        return {"message": f"Player {mode_change_input.player} mode set to {mode_change_input.mode}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
