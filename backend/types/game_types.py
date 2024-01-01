from pydantic import BaseModel

class Move(BaseModel):
    column: int
class Mode(BaseModel):
    mode: str