from backend.game.base import TurnBasedGame
from backend.game.agents.human import HumanPlayer
from backend.game.agents.random import RandomPlayer
from backend.game.agents.gomoku_ai import GomokuPlayer
from backend.game import gomoku_rules as rules


class GomokuEnv(TurnBasedGame):
    """Gomoku (five in a row) on a 15x15 board. A move is a cell index 0-224,
    row by row. Freestyle rules: five or more in a row wins."""
    game_type = "gomoku"
    ROWS, COLS = rules.SIZE, rules.SIZE
    player_modes = {
        'human': HumanPlayer,
        'random': RandomPlayer,
        'heuristic': GomokuPlayer,
    }
    hint_mode = 'heuristic'

    @property
    def num_actions(self):
        return self.ROWS * self.COLS

    def _is_valid_action(self, action):
        return (isinstance(action, int) and 0 <= action < self.num_actions
                and self.board[action // self.COLS][action % self.COLS] == ' ')

    def _make_move(self, action):
        self.board[action // self.COLS][action % self.COLS] = self.current_player

    def find_winning_cells(self, player):
        return rules.winning_line(self._get_obs(), -1 if player == 'X' else 1)
