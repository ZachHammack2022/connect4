import asyncio
import random

from backend.game.agents.player import AIPlayer
from backend.game import gomoku_rules as rules

SIZE = rules.SIZE
CENTER = (SIZE // 2) * SIZE + SIZE // 2

# Value of a 5-cell window by how many of one player's stones it would hold
# (and none of the other's). Gaps count, so X X _ X X is a four.
ATTACK = {1: 1, 2: 10, 3: 120, 4: 2_500, 5: 1_000_000}
DEFENCE = {1: 1, 2: 8, 3: 150, 4: 100_000}

# Easier levels sometimes play a random nearby move instead of the best one.
RANDOM_MOVE_CHANCE = {"easy": 0.35, "medium": 0.0, "hard": 0.0}

# Precompute the windows through every cell once.
WINDOWS = [rules.windows_through(i) for i in range(SIZE * SIZE)]


def candidates(cells):
    """Empty cells within two of a stone (the centre on an empty board)."""
    stones = [i for i, cell in enumerate(cells) if cell]
    if not stones:
        return [CENTER]
    near = set()
    for i in stones:
        r, c = divmod(i, SIZE)
        for dr in range(-2, 3):
            for dc in range(-2, 3):
                rr, cc = r + dr, c + dc
                if 0 <= rr < SIZE and 0 <= cc < SIZE and not cells[rr * SIZE + cc]:
                    near.add(rr * SIZE + cc)
    return list(near)


def move_score(cells, index, player):
    """How good playing `index` is for `player`: lines it builds plus the
    opponent's lines it blocks."""
    score = 0
    for window in WINDOWS[index]:
        mine = theirs = 0
        for i in window:
            if cells[i] == player:
                mine += 1
            elif cells[i] == -player:
                theirs += 1
        if theirs == 0:
            score += ATTACK[mine + 1]
        elif mine == 0:
            score += DEFENCE[theirs]
    return score


def ranked_moves(cells, player):
    moves = candidates(cells)
    scored = [(move_score(cells, m, player), random.random(), m) for m in moves]
    scored.sort(reverse=True)
    return scored


# Every 5-cell window on the board, for whole-board evaluation.
ALL_WINDOWS = sorted({tuple(w) for ws in WINDOWS for w in ws})
WINDOW_VALUE = {0: 0, 1: 1, 2: 12, 3: 150, 4: 3_000}
WIN = 10_000_000
SEARCH_DEPTH = 4
BRANCHING = 6


def evaluate(cells, player):
    """Whole-board score for `player`, who is about to move."""
    total = 0
    for window in ALL_WINDOWS:
        mine = theirs = 0
        for i in window:
            v = cells[i]
            if v == player:
                mine += 1
            elif v:
                theirs += 1
        if theirs == 0:
            total += WINDOW_VALUE[mine]
        elif mine == 0:
            total -= WINDOW_VALUE[theirs] * 1.5  # weigh their threats more: safer play
    return total


def negamax(cells, player, depth, alpha, beta):
    ranked = ranked_moves(cells, player)[:BRANCHING]
    if not ranked:
        return 0
    if ranked[0][0] >= ATTACK[5]:
        return WIN + depth  # we can win right now (sooner is better)
    if depth == 0:
        return evaluate(cells, player)
    best = -float('inf')
    for _, _, move in ranked:
        cells[move] = player
        score = -negamax(cells, -player, depth - 1, -beta, -alpha)
        cells[move] = 0
        if score > best:
            best = score
        alpha = max(alpha, score)
        if alpha >= beta:
            break
    return best


def best_move(cells, player, difficulty):
    ranked = ranked_moves(cells, player)
    # Take a win, or (as the top-ranked move always does) block one.
    if difficulty != "hard" or ranked[0][0] >= DEFENCE[4]:
        return ranked[0][2]
    # Hard: a short alpha-beta search over the most promising moves.
    best, alpha = ranked[0][2], -float('inf')
    for _, _, move in ranked[:BRANCHING]:
        cells[move] = player
        score = -negamax(cells, -player, SEARCH_DEPTH - 1, -float('inf'), -alpha)
        cells[move] = 0
        if score > alpha:
            best, alpha = move, score
    return best


class GomokuPlayer(AIPlayer):
    def __init__(self, difficulty="medium"):
        super().__init__(name="heuristic", display_name="Heuristic", difficulty=difficulty)

    async def make_move(self, obs, legal_moves=None, **context):
        cells = list(obs)
        if all(cells):
            return None
        # X (-1) moves first, so equal counts means it is X's turn.
        player = -1 if cells.count(-1) == cells.count(1) else 1
        if random.random() < RANDOM_MOVE_CHANCE[self.difficulty]:
            return random.choice(candidates(cells))
        # The hard search is CPU-bound; run it in a thread so other games keep being served.
        return await asyncio.to_thread(best_move, cells, player, self.difficulty)
