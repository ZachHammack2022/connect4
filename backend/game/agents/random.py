import random
from backend.game.agents.player import AIPlayer


def valid_moves(obs, num_cols=7):
    """Columns whose top cell (first row of the flat observation) is empty."""
    return [col for col in range(num_cols) if obs[col] == 0]


class RandomPlayer(AIPlayer):
    supports_difficulty = False

    def __init__(self, difficulty=None, name="random", display_name="Random"):
        super().__init__(name=name, display_name=display_name)

    async def make_move(self, obs, legal_moves=None, **context):
        moves = legal_moves if legal_moves is not None else valid_moves(obs)
        return random.choice(moves) if moves else None
