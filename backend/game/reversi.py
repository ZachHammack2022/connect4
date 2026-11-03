from backend.game.base import TurnBasedGame
from backend.game.agents.human import HumanPlayer
from backend.game.agents.random import RandomPlayer
from backend.game.agents.reversi_ai import ReversiMinimaxPlayer
from backend.game import reversi_rules as rules

TO_INT = {' ': 0, 'X': -1, 'O': 1}
TO_CELL = {0: ' ', -1: 'X', 1: 'O'}


class ReversiEnv(TurnBasedGame):
    """Reversi (Othello) on an 8x8 board. A move is a cell index 0-63, row by row.

    X (dark) moves first. A move must flip at least one opposing disc. A player
    with no legal move passes; when neither player can move the game ends and
    the player with more discs wins.
    """
    game_type = "reversi"
    ROWS, COLS = rules.SIZE, rules.SIZE
    player_modes = {
        'human': HumanPlayer,
        'random': RandomPlayer,
        'minimax': ReversiMinimaxPlayer,
    }

    @property
    def num_actions(self):
        return self.ROWS * self.COLS

    def _cells(self):
        return [TO_INT[cell] for row in self.board for cell in row]

    def _set_cells(self, cells):
        self.board = [[TO_CELL[cells[r * self.COLS + c]] for c in range(self.COLS)] for r in range(self.ROWS)]

    def _player_int(self, player=None):
        return TO_INT[player or self.current_player]

    def reset(self):
        obs = super().reset()
        self._set_cells(rules.start_cells())
        return self._get_obs()

    def _is_valid_action(self, action):
        return (isinstance(action, int) and 0 <= action < self.num_actions
                and bool(rules.flips(self._cells(), action, self._player_int())))

    def valid_actions(self):
        return rules.legal_moves(self._cells(), self._player_int())

    def _make_move(self, action):
        self._set_cells(rules.play(self._cells(), action, self._player_int()))

    def ai_context(self):
        return {"to_move": self._player_int()}

    def counts(self):
        cells = self._cells()
        return {"X": cells.count(-1), "O": cells.count(1)}

    def find_winning_cells(self, player):
        """Once the game is over, the winner's discs; Reversi has no winning line."""
        if not self.terminated or self.winner != player:
            return []
        return [[r, c] for r in range(self.ROWS) for c in range(self.COLS) if self.board[r][c] == player]

    def step(self, action):
        if self.terminated:
            return self._get_obs(), -10, self.terminated, {"msg": "Game terminated."}
        if not self._is_valid_action(action):
            return self._get_obs(), -2, True, {"msg": "Invalid action."}

        self._make_move(action)
        self.passed = None
        mover = self.current_player
        opponent = 'O' if mover == 'X' else 'X'
        cells = self._cells()
        if rules.legal_moves(cells, self._player_int(opponent)):
            self.current_player = opponent
        elif rules.legal_moves(cells, self._player_int(mover)):
            self.passed = opponent  # opponent has no move: the mover goes again
        else:
            self._finish()
        return self._get_obs(), 0.01, self.terminated, {"winner": self.winner}

    def _finish(self):
        self.terminated = True
        counts = self.counts()
        if counts["X"] != counts["O"]:
            self.winner = 'X' if counts["X"] > counts["O"] else 'O'
            self.winning_cells = self.find_winning_cells(self.winner)
