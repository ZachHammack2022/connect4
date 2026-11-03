from typing import Literal
from pydantic import BaseModel, Field, field_validator

from backend.game.registry import GAME_TYPES, DEFAULT_GAME_TYPE


class GameResult(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    game_type: str = DEFAULT_GAME_TYPE
    outcome: Literal["win", "loss", "draw"]

    @field_validator("game_type")
    @classmethod
    def known_game_type(cls, value):
        if value not in GAME_TYPES:
            raise ValueError(f"Unknown game type: {value}")
        return value
