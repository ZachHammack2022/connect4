from fastapi import FastAPI
from pydantic import BaseModel
from game import Connect4Env
from fastapi import HTTPException


app = FastAPI()
game = Connect4Env()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, for development only
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Move(BaseModel):
    column: int

@app.post("/move")
def make_move(move: Move):
    if not game._is_valid_action(move.column):
        raise HTTPException(status_code=400, detail="Invalid action, column full.")
    if game.terminated:
        return {"board": game._get_obs(), "reward": 0, "done": True, "winner": game.winner}
    _, reward, terminated, _ = game.step(move.column)
    return {"board": game._get_obs(), "reward": reward, "done": terminated,"winner": game.winner, "current_player": game.current_player}

@app.post("/reset")
def reset_game():
    return game.reset()

@app.get("/state")
def get_state():
    return {"board": game._get_obs(), "current_player": game.current_player}
