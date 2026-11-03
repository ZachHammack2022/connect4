DIFFICULTIES = ("easy", "medium", "hard")


class Player:
    # Whether the difficulty setting changes how this player plays.
    supports_difficulty = False

    def __init__(self, name, display_name, difficulty=None):
        self.name = name
        self.display_name = display_name
        if self.supports_difficulty:
            difficulty = difficulty or "medium"
            if difficulty not in DIFFICULTIES:
                raise ValueError(f"Invalid difficulty: {difficulty}")
        self.difficulty = difficulty if self.supports_difficulty else None

    async def make_move(self, obs, legal_moves=None):
        raise NotImplementedError


class AIPlayer(Player):
    supports_difficulty = True
