from typing import Literal, Optional
from pydantic import BaseModel

class ModeChangeInput(BaseModel):
    player: int
    mode: str
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None

