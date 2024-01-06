from pydantic import BaseModel

class ModeChangeInput(BaseModel):
    player: int
    mode: str

