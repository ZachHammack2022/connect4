from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

from backend.game.agents.player import DIFFICULTIES
from backend.game.registry import GAME_TYPES, DEFAULT_GAME_TYPE


class GameResult(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    game_type: str = DEFAULT_GAME_TYPE
    outcome: Literal["win", "loss", "draw"]
    # The AI the human played against (its mode and difficulty). Optional so
    # older clients keep working; such results only count in the overall table.
    opponent: Optional[str] = None
    difficulty: Optional[Literal[DIFFICULTIES]] = None

    @field_validator("game_type")
    @classmethod
    def known_game_type(cls, value):
        if value not in GAME_TYPES:
            raise ValueError(f"Unknown game type: {value}")
        return value

    @model_validator(mode="after")
    def known_opponent(self):
        if self.opponent is not None:
            modes = GAME_TYPES[self.game_type].player_modes
            if self.opponent not in modes or self.opponent == "human":
                raise ValueError(f"Unknown AI opponent for {self.game_type}: {self.opponent}")
            if not modes[self.opponent].supports_difficulty:
                self.difficulty = None
        return self
