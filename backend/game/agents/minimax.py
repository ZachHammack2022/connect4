import asyncio
from backend.game.agents.player import AIPlayer
from backend.game.connect4_logic import check_positive_horizontal, check_negative_horizontal, check_vertical, check_horizontal

ROWS, COLS = 6, 7
WIN_SCORE = 1_000_000
# Explore centre columns first: they are usually the strongest moves, which
# makes alpha-beta pruning far more effective.
MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6]


class MinimaxPlayer(AIPlayer):
    def __init__(self, depth=5):
        super().__init__(name="minimax", display_name="Minimax")
        self.depth = depth

    def check_winner(self, player, board):
        return bool(check_horizontal(board, player) or
                    check_vertical(board, player) or
                    check_positive_horizontal(board, player) or
                    check_negative_horizontal(board, player))

    def reconstruct_board(self, flat_board):
        return [list(flat_board[i * COLS:(i + 1) * COLS]) for i in range(ROWS)]

    def convert_to_symbols(self, board):
        symbol_map = {-1: 'X', 0: ' ', 1: 'O'}
        return [[symbol_map[cell] for cell in row] for row in board]

    def obs_to_board(self, obs):
        return self.convert_to_symbols(self.reconstruct_board(obs))

    def _is_valid_action(self, action, board):
        return board[0][action] == ' '

    def get_valid_moves(self, board):
        return [move for move in MOVE_ORDER if self._is_valid_action(move, board)]

    def simulate_move(self, board, move, player):
        new_board = [row[:] for row in board]
        for row in reversed(new_board):
            if row[move] == ' ':
                row[move] = player
                break
        return new_board

    # ---- heuristic -------------------------------------------------------
    @staticmethod
    def _score_window(window, me, opp):
        mine, theirs, empty = window.count(me), window.count(opp), window.count(' ')
        if mine == 3 and empty == 1:
            return 5
        if mine == 2 and empty == 2:
            return 2
        if theirs == 3 and empty == 1:
            return -4
        return 0

    def heuristic(self, board, me):
        """Static evaluation of a non-terminal board from `me`'s point of view."""
        opp = 'O' if me == 'X' else 'X'
        score = 3 * [board[r][COLS // 2] for r in range(ROWS)].count(me)
        for r in range(ROWS):
            for c in range(COLS):
                for dr, dc in ((0, 1), (1, 0), (1, 1), (-1, 1)):
                    end_r, end_c = r + 3 * dr, c + 3 * dc
                    if 0 <= end_r < ROWS and end_c < COLS:
                        window = [board[r + i * dr][c + i * dc] for i in range(4)]
                        score += self._score_window(window, me, opp)
        return score

    # ---- search ----------------------------------------------------------
    def minimax(self, board, depth, alpha, beta, maximizing, me):
        """Score `board` from `me`'s perspective. `maximizing` is True when it is `me` to move."""
        opp = 'O' if me == 'X' else 'X'
        # Prefer faster wins and slower losses by scaling with remaining depth.
        if self.check_winner(me, board):
            return WIN_SCORE + depth
        if self.check_winner(opp, board):
            return -WIN_SCORE - depth
        moves = self.get_valid_moves(board)
        if not moves:
            return 0  # draw
        if depth == 0:
            return self.heuristic(board, me)

        if maximizing:
            value = float('-inf')
            for move in moves:
                value = max(value, self.minimax(self.simulate_move(board, move, me), depth - 1, alpha, beta, False, me))
                alpha = max(alpha, value)
                if alpha >= beta:
                    break
        else:
            value = float('inf')
            for move in moves:
                value = min(value, self.minimax(self.simulate_move(board, move, opp), depth - 1, alpha, beta, True, me))
                beta = min(beta, value)
                if alpha >= beta:
                    break
        return value

    async def make_move(self, obs):
        # The search is CPU-bound; run it in a thread so other players'
        # requests keep being served while the AI thinks.
        return await asyncio.to_thread(self.best_move, obs)

    def best_move(self, obs):
        board = self.obs_to_board(obs)

        # X always moves first, so equal piece counts means it is X's turn.
        num_x = sum(cell == 'X' for row in board for cell in row)
        num_o = sum(cell == 'O' for row in board for cell in row)
        me = 'X' if num_x == num_o else 'O'

        best_score, best_move = float('-inf'), None
        for move in self.get_valid_moves(board):
            # After our move it is the opponent's turn, i.e. a minimizing node.
            score = self.minimax(self.simulate_move(board, move, me), self.depth - 1,
                                 float('-inf'), float('inf'), False, me)
            if score > best_score:
                best_score, best_move = score, move
        return best_move
