from pydantic import BaseModel, Field


class Move(BaseModel):
    column: int = Field(ge=0, le=6)


class Mode(BaseModel):
    mode: str
