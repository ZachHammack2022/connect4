import asyncio
import random

from backend.game.agents.player import AIPlayer
from backend.game import reversi_rules as rules

# Classic positional weights: corners are gold, the squares next to them are poison.
WEIGHTS = [
    100, -20, 10, 5, 5, 10, -20, 100,
    -20, -50, -2, -2, -2, -2, -50, -20,
    10, -2, 1, 1, 1, 1, -2, 10,
    5, -2, 1, 0, 0, 1, -2, 5,
    5, -2, 1, 0, 0, 1, -2, 5,
    10, -2, 1, 1, 1, 1, -2, 10,
    -20, -50, -2, -2, -2, -2, -50, -20,
    100, -20, 10, 5, 5, 10, -20, 100,
]

# Search depth per difficulty; easier levels also sometimes play a random move.
DEPTH = {"easy": 1, "medium": 3, "hard": 4}
RANDOM_MOVE_CHANCE = {"easy": 0.3, "medium": 0.05, "hard": 0.0}
WIN = 100_000


def evaluate(cells, player):
    """Score for `player`: position weights, plus mobility, plus disc count late on."""
    positional = sum(w * c for w, c in zip(WEIGHTS, cells)) * player
    mobility = len(rules.legal_moves(cells, player)) - len(rules.legal_moves(cells, -player))
    empty = cells.count(0)
    discs = (cells.count(player) - cells.count(-player)) if empty < 14 else 0
    return positional + 5 * mobility + 3 * discs


def negamax(cells, player, depth, alpha, beta):
    moves = rules.legal_moves(cells, player)
    if not moves:
        if not rules.legal_moves(cells, -player):
            diff = cells.count(player) - cells.count(-player)
            return (WIN + diff) if diff > 0 else (-WIN + diff) if diff < 0 else 0
        return -negamax(cells, -player, depth, -beta, -alpha)  # pass
    if depth == 0:
        return evaluate(cells, player)
    moves.sort(key=lambda m: -WEIGHTS[m])  # try corners first for better pruning
    best = -float('inf')
    for move in moves:
        score = -negamax(rules.play(cells, move, player), -player, depth - 1, -beta, -alpha)
        best = max(best, score)
        alpha = max(alpha, score)
        if alpha >= beta:
            break
    return best


def best_move(cells, player, depth):
    moves = rules.legal_moves(cells, player)
    if not moves:
        return None
    moves.sort(key=lambda m: -WEIGHTS[m])
    best_score, best_moves = -float('inf'), []
    alpha = -float('inf')
    for move in moves:
        score = -negamax(rules.play(cells, move, player), -player, depth - 1, -float('inf'), -alpha)
        if score > best_score:
            best_score, best_moves = score, [move]
        elif score == best_score:
            best_moves.append(move)
        alpha = max(alpha, score)
    return random.choice(best_moves)


class ReversiMinimaxPlayer(AIPlayer):
    def __init__(self, difficulty="medium"):
        super().__init__(name="minimax", display_name="Minimax", difficulty=difficulty)

    async def make_move(self, obs, legal_moves=None, to_move=None):
        cells = list(obs)
        if to_move is None:
            raise ValueError("Reversi AI needs to know whose turn it is")
        moves = legal_moves if legal_moves is not None else rules.legal_moves(cells, to_move)
        if not moves:
            return None
        if random.random() < RANDOM_MOVE_CHANCE[self.difficulty]:
            return random.choice(moves)
        # CPU-bound search runs in a thread so other games keep being served.
        return await asyncio.to_thread(best_move, cells, to_move, DEPTH[self.difficulty])
