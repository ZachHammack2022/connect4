from fastapi import APIRouter, HTTPException, Depends
from backend.types.game_types import Move,Mode
from game.game import Connect4Env
from backend.dependencies import get_game
router = APIRouter()

@router.post("/move")
async def make_move(move: Move, game: Connect4Env = Depends(get_game)):
    if not game._is_valid_action(move.column):
        raise HTTPException(status_code=400, detail="Invalid action, column full.")
    if game.terminated:
        return {"board": game._get_obs()[1:], "reward": 0, "done": True, "winner": game.winner}
    _, reward, terminated, _ = game.step(move.column)
    print(len(game._get_obs()))
    return {"board": game._get_obs(), "reward": reward, "done": terminated,"winner": game.winner, "current_player": game.current_player}

@router.post("/reset")
async def reset_game(game: Connect4Env = Depends(get_game)):
    game.reset()
    print(game._get_obs())
    return {"board": game._get_obs(), "current_player": game.current_player}

@router.get("/state")
async def get_state(game: Connect4Env = Depends(get_game)):
    return {"board": game._get_obs(), "current_player": game.current_player}

@router.post("/set_mode")
async def set_mode(mode: Mode,player:int, game: Connect4Env = Depends(get_game)):
    try:
        game.set_mode(player,mode.mode)
        return {f"message": "Player {player} mode set to " + mode.mode}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))