import random
from functools import lru_cache

from backend.game.agents.player import AIPlayer

LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]

# Tic-tac-toe is small enough to search completely, so "hard" never loses.
# Easier levels sometimes play a random move instead.
RANDOM_MOVE_CHANCE = {"easy": 0.5, "medium": 0.2, "hard": 0.0}


def _winner(cells):
    for a, b, c in LINES:
        if cells[a] != 0 and cells[a] == cells[b] == cells[c]:
            return cells[a]
    return 0


@lru_cache(maxsize=None)
def _score(cells, to_move):
    """Best achievable outcome for `to_move` (+1 win, 0 draw, -1 loss),
    favouring quicker wins and slower losses."""
    if _winner(cells):
        return -1.0  # the previous player just won
    empty = [i for i, cell in enumerate(cells) if cell == 0]
    if not empty:
        return 0.0
    best = -2.0
    for i in empty:
        child = cells[:i] + (to_move,) + cells[i + 1:]
        best = max(best, -0.9 * _score(child, -to_move))
    return best


class TicTacToeMinimaxPlayer(AIPlayer):
    def __init__(self, difficulty="medium"):
        super().__init__(name="minimax", display_name="Minimax", difficulty=difficulty)
        self.random_move_chance = RANDOM_MOVE_CHANCE[self.difficulty]

    async def make_move(self, obs, legal_moves=None):
        cells = tuple(obs)
        moves = [i for i, cell in enumerate(cells) if cell == 0]
        if not moves:
            return None
        if random.random() < self.random_move_chance:
            return random.choice(moves)
        # X (-1) moves first, so equal counts means it is X's turn.
        me = -1 if cells.count(-1) == cells.count(1) else 1
        scores = {i: -_score(cells[:i] + (me,) + cells[i + 1:], -me) for i in moves}
        best = max(scores.values())
        return random.choice([i for i, s in scores.items() if s == best])
