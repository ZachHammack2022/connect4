import asyncio
import math
import random
import time

from backend.game.agents.player import AIPlayer

ROWS, COLS = 6, 7
CENTER_FIRST = [3, 2, 4, 1, 5, 0, 6]

# Simulations per move, with a time cap so a slow machine can't stall a game.
DIFFICULTY_SETTINGS = {
    "easy": {"iterations": 150, "time_limit": 0.5},
    "medium": {"iterations": 2000, "time_limit": 1.5},
    "hard": {"iterations": 20000, "time_limit": 2.5},
}


class Board:
    """Compact mutable board for fast simulations. Cells hold 1 (X), 2 (O) or 0."""
    __slots__ = ("cells", "heights", "to_move", "moves_played")

    def __init__(self, cells, heights, to_move, moves_played):
        self.cells = cells
        self.heights = heights      # number of discs in each column
        self.to_move = to_move
        self.moves_played = moves_played

    @classmethod
    def from_obs(cls, obs):
        # The observation is row-major with row 0 at the top: -1 = X, 1 = O.
        cells = [0] * (ROWS * COLS)
        heights = [0] * COLS
        for top_row in range(ROWS):
            for col in range(COLS):
                value = obs[top_row * COLS + col]
                if value:
                    bottom_row = ROWS - 1 - top_row
                    cells[bottom_row * COLS + col] = 1 if value == -1 else 2
                    heights[col] = max(heights[col], bottom_row + 1)
        moves_played = sum(heights)
        to_move = 1 if moves_played % 2 == 0 else 2
        return cls(cells, heights, to_move, moves_played)

    def copy(self):
        return Board(self.cells[:], self.heights[:], self.to_move, self.moves_played)

    def legal_moves(self):
        return [col for col in CENTER_FIRST if self.heights[col] < ROWS]

    def play(self, col):
        """Drop the side-to-move's disc in `col`; return True if it wins."""
        row = self.heights[col]
        player = self.to_move
        self.cells[row * COLS + col] = player
        self.heights[col] += 1
        self.moves_played += 1
        self.to_move = 3 - player
        return self._wins_at(row, col, player)

    def is_winning_move(self, col, player):
        row = self.heights[col]
        if row >= ROWS:
            return False
        index = row * COLS + col
        self.cells[index] = player
        won = self._wins_at(row, col, player)
        self.cells[index] = 0
        return won

    def _wins_at(self, row, col, player):
        cells = self.cells
        for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
            count = 1
            for sign in (1, -1):
                r, c = row + sign * dr, col + sign * dc
                while 0 <= r < ROWS and 0 <= c < COLS and cells[r * COLS + c] == player:
                    count += 1
                    r += sign * dr
                    c += sign * dc
            if count >= 4:
                return True
        return False


class Node:
    __slots__ = ("move", "parent", "children", "untried", "visits", "wins", "player_just_moved")

    def __init__(self, board, move=None, parent=None):
        self.move = move
        self.parent = parent
        self.children = []
        self.untried = board.legal_moves()
        self.visits = 0
        self.wins = 0.0                       # from the perspective of player_just_moved
        self.player_just_moved = 3 - board.to_move

    def select_child(self, exploration=1.41):
        log_visits = math.log(self.visits)
        return max(self.children,
                   key=lambda child: child.wins / child.visits + exploration * math.sqrt(log_visits / child.visits))


class MCTSPlayer(AIPlayer):
    def __init__(self, difficulty="medium"):
        super().__init__(name="mcts", display_name="MCTS", difficulty=difficulty)
        settings = DIFFICULTY_SETTINGS[self.difficulty]
        self.iterations = settings["iterations"]
        self.time_limit = settings["time_limit"]

    async def make_move(self, obs):
        # CPU-bound search runs in a thread so other games keep being served.
        return await asyncio.to_thread(self.best_move, obs)

    def best_move(self, obs):
        board = Board.from_obs(obs)
        moves = board.legal_moves()
        if not moves:
            return None
        me, opponent = board.to_move, 3 - board.to_move

        # Tactical shortcuts that random rollouts can miss at low budgets:
        # take a win, otherwise block the opponent's immediate win.
        for col in moves:
            if board.is_winning_move(col, me):
                return col
        for col in moves:
            if board.is_winning_move(col, opponent):
                return col

        root = Node(board)
        deadline = time.monotonic() + self.time_limit
        for i in range(self.iterations):
            if i % 64 == 0 and time.monotonic() > deadline:
                break
            self._iterate(root, board)

        # The most-visited move is the most robust choice.
        return max(root.children, key=lambda child: child.visits).move

    def _iterate(self, root, root_board):
        node, board = root, root_board.copy()
        winner = None

        # 1. Selection: descend through fully expanded nodes.
        while not node.untried and node.children:
            node = node.select_child()
            if board.play(node.move):
                winner = node.player_just_moved

        # 2. Expansion: add one unexplored child.
        if winner is None and node.untried:
            move = node.untried.pop(random.randrange(len(node.untried)))
            if board.play(move):
                winner = 3 - board.to_move
            child = Node(board, move, node)
            node.children.append(child)
            node = child

        # 3. Simulation: random playout to the end of the game.
        while winner is None:
            moves = [col for col in range(COLS) if board.heights[col] < ROWS]
            if not moves:
                break  # draw
            if board.play(random.choice(moves)):
                winner = 3 - board.to_move

        # 4. Backpropagation.
        while node is not None:
            node.visits += 1
            if winner is None:
                node.wins += 0.5
            elif winner == node.player_just_moved:
                node.wins += 1
            node = node.parent
