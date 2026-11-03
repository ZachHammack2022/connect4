from pydantic import AliasChoices, BaseModel, Field, field_validator

from backend.game.registry import GAME_TYPES, DEFAULT_GAME_TYPE


class Move(BaseModel):
    # The move's meaning depends on the game: a column in Connect 4, a cell
    # index (0-8) in tic-tac-toe. "column" is still accepted for Connect 4.
    move: int = Field(ge=0, validation_alias=AliasChoices("move", "column"))


class NewGame(BaseModel):
    game_type: str = DEFAULT_GAME_TYPE

    @field_validator("game_type")
    @classmethod
    def known_game_type(cls, value):
        if value not in GAME_TYPES:
            raise ValueError(f"Unknown game type: {value}")
        return value


class NewOnlineGame(NewGame):
    name: str = Field(default="Player 1", min_length=1, max_length=255)


class JoinGame(BaseModel):
    name: str = Field(default="Player 2", min_length=1, max_length=255)
