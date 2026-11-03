from backend.game.base import TurnBasedGame
from backend.game.agents.human import HumanPlayer
from backend.game.agents.random import RandomPlayer
from backend.game.agents.tictactoe_minimax import TicTacToeMinimaxPlayer

LINES = [
    [(0, 0), (0, 1), (0, 2)], [(1, 0), (1, 1), (1, 2)], [(2, 0), (2, 1), (2, 2)],  # rows
    [(0, 0), (1, 0), (2, 0)], [(0, 1), (1, 1), (2, 1)], [(0, 2), (1, 2), (2, 2)],  # columns
    [(0, 0), (1, 1), (2, 2)], [(0, 2), (1, 1), (2, 0)],                            # diagonals
]


class TicTacToeEnv(TurnBasedGame):
    """Tic-tac-toe. A move is a cell index 0-8, row by row from the top left."""
    game_type = "tictactoe"
    ROWS, COLS = 3, 3
    player_modes = {
        'human': HumanPlayer,
        'random': RandomPlayer,
        'minimax': TicTacToeMinimaxPlayer,
    }

    @property
    def num_actions(self):
        return self.ROWS * self.COLS

    def _is_valid_action(self, action):
        return (isinstance(action, int) and 0 <= action < self.num_actions
                and self.board[action // self.COLS][action % self.COLS] == ' ')

    def _make_move(self, action):
        self.board[action // self.COLS][action % self.COLS] = self.current_player

    def find_winning_cells(self, player):
        cells = []
        for line in LINES:
            if all(self.board[r][c] == player for r, c in line):
                cells.extend([r, c] for r, c in line if [r, c] not in cells)
        return cells
