from fastapi import FastAPI
from pydantic import BaseModel
from game import Connect4Env

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

@app.post("/start")
def start_game():
    return game.reset()

@app.post("/move")
def make_move(move: Move):
    _, reward, done, _ = game.step(move.column)
    return {"board": game._get_obs(), "reward": reward, "done": done}

@app.get("/state")
def get_state():
    return {"board": game._get_obs(), "current_player": game.current_player}
