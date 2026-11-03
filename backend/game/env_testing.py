import unittest
from backend.game.game import Connect4Env
from backend.game.agents.minimax import MinimaxPlayer
from backend.game.agents.mcts import MCTSPlayer
from backend.game.tictactoe import TicTacToeEnv
from backend.game.registry import game_from_dict

class TestConnect4Env(unittest.IsolatedAsyncioTestCase):
    

    async def test_horizontal_win(self):
        env = Connect4Env()
        moves = [1, 1, 2, 2, 3, 3, 4]
        last_player = 'X'  # Start with player 'X'

        for move in moves:
            _, _, done, _ =  env.step(move)
            if done:
                break
            last_player = 'O' if last_player == 'X' else 'X'  # Switch player after each move

        self.assertTrue(env.check_winner(last_player))  # Check if the last player won

    async def test_vertical_win(self):
        env = Connect4Env()
        moves = [0, 1, 0, 1, 0, 1, 0]  # Same column to get a vertical win
        last_player = 'X'

        for move in moves:
            _, _, done, _ =  env.step(move)
            if done:
                break
            last_player = 'O' if last_player == 'X' else 'X'
        
        self.assertTrue(env.check_winner(last_player))

    async def test_positive_diagonal_win(self):
        env = Connect4Env()
        moves = [0, 1, 1, 2, 2, 3, 2, 3, 5, 3,3]  # Moves to create a positive diagonal
        last_player = 'X'

        for move in moves:
            _, _, done, _ =  env.step(move)
            if done:
                break
            last_player = 'O' if last_player == 'X' else 'X'
        self.assertTrue(env.check_winner(last_player))

    # Test for negative diagonal win
    async def test_negative_diagonal_win(self):
        env = Connect4Env()
        moves = [3, 2, 2, 1, 1, 0, 1, 0, 0, 6,0]  # Moves to create a negative diagonal
        last_player = 'X'

        for move in moves:
            _, _, done, _ =  env.step(move)
            if done:
                break
            last_player = 'O' if last_player == 'X' else 'X'
        self.assertTrue(env.check_winner(last_player))

    # Test for a full board without a winner
    async def test_full_board_no_winner(self):
        env = Connect4Env()
        # A sequence of moves that fills the board without a winner
        moves = [
            1, 0, 0,0,0,0, 0, # Column 0
            4,6,1,1,1,1, #column 1
            2,2,2,2,2,2, #etc
            3,3,3,3,3,3,
            4,4,4,4,4,
            5,5,5,5,5,5,
            6,6,6,6,6,1
        ]
        
        for move in moves:
            _, _, done, _ =  env.step(move)
        self.assertTrue(env._is_board_full() and not env.check_winner('X') and not env.check_winner('O'))


    async def test_invalid_move(self):
        env = Connect4Env()
        env.board[0][0] = 'X'  # Column 0 is now full
        self.assertFalse(env._is_valid_action(0))

    async def test_minimax_takes_immediate_win_as_second_player(self):
        env = Connect4Env()
        for move in [0, 3, 0, 3, 1, 3, 6]:  # O has three stacked in column 3
            env.step(move)
        self.assertEqual(await MinimaxPlayer().make_move(env._get_obs()), 3)

    async def test_minimax_blocks_opponent_win(self):
        env = Connect4Env()
        for move in [0, 6, 1, 6, 2]:  # X threatens column 3 on the bottom row
            env.step(move)
        self.assertEqual(await MinimaxPlayer().make_move(env._get_obs()), 3)

    async def test_ai_never_crashes_on_full_columns(self):
        env = Connect4Env('random', 'random')
        for _ in range(50):
            env.reset()
            obs, _, done, _ = await env.run_ai_turns()
            self.assertTrue(done)

    async def test_run_ai_turns_when_game_over(self):
        env = Connect4Env('human', 'minimax')
        for move in [0, 1, 0, 1, 0, 1, 0]:
            env.step(move)
        self.assertTrue(env.terminated)
        await env.set_mode(2, 'random')  # used to raise UnboundLocalError

    async def test_reset_lets_ai_open(self):
        env = Connect4Env('minimax', 'human')
        await env.reset_and_start()
        self.assertEqual(env.current_player, 'O')
        self.assertEqual(sum(1 for cell in env._get_obs() if cell != 0), 1)

    def test_out_of_range_action_is_invalid(self):
        env = Connect4Env()
        self.assertFalse(env._is_valid_action(-1))
        self.assertFalse(env._is_valid_action(7))

    async def test_mcts_takes_win_and_blocks(self):
        env = Connect4Env()
        for move in [0, 3, 0, 3, 1, 3, 6]:  # O to move, O wins in column 3
            env.step(move)
        self.assertEqual(await MCTSPlayer('easy').make_move(env._get_obs()), 3)
        env.reset()
        for move in [0, 6, 1, 6, 2]:  # O to move, must block column 3
            env.step(move)
        self.assertEqual(await MCTSPlayer('easy').make_move(env._get_obs()), 3)

    async def test_mcts_plays_full_games(self):
        env = Connect4Env('mcts', 'random')
        await env.set_mode(1, 'mcts', 'easy')
        for _ in range(5):
            await env.reset_and_start()
            self.assertTrue(env.terminated)

    async def test_difficulty(self):
        env = Connect4Env()
        await env.set_mode(2, 'minimax', 'hard')
        self.assertEqual((env.player2.difficulty, env.player2.depth), ('hard', 6))
        await env.set_mode(2, 'mcts')
        self.assertEqual(env.player2.difficulty, 'medium')
        await env.set_mode(2, 'random', 'hard')  # random has no difficulty
        self.assertIsNone(env.player2.difficulty)
        with self.assertRaises(ValueError):
            await env.set_mode(2, 'minimax', 'impossible')

    def test_winning_cells(self):
        env = Connect4Env()
        for move in [0, 0, 1, 1, 2, 2, 3]:  # X wins along the bottom row
            env.step(move)
        self.assertEqual(sorted(env.winning_cells), [[5, 0], [5, 1], [5, 2], [5, 3]])
        env.reset()
        self.assertEqual(env.winning_cells, [])



class TestTicTacToe(unittest.IsolatedAsyncioTestCase):
    def play(self, moves):
        env = TicTacToeEnv()
        for move in moves:
            env.step(move)
        return env

    def test_row_column_and_diagonal_wins(self):
        for moves, cells in [
            ([0, 3, 1, 4, 2], [[0, 0], [0, 1], [0, 2]]),
            ([1, 0, 4, 2, 7], [[0, 1], [1, 1], [2, 1]]),
            ([2, 0, 4, 1, 6], [[0, 2], [1, 1], [2, 0]]),
        ]:
            env = self.play(moves)
            self.assertEqual((env.winner, env.terminated), ('X', True))
            self.assertEqual(sorted(env.winning_cells), sorted(cells))

    def test_draw(self):
        env = self.play([0, 1, 2, 4, 3, 5, 7, 6, 8])
        self.assertEqual((env.winner, env.terminated), (None, True))

    def test_invalid_moves(self):
        env = self.play([4])
        self.assertFalse(env._is_valid_action(4))
        self.assertFalse(env._is_valid_action(9))
        self.assertFalse(env._is_valid_action(-1))

    async def test_perfect_minimax_never_loses(self):
        for _ in range(30):
            env = TicTacToeEnv('random', 'minimax')
            await env.set_mode(2, 'minimax', 'hard')
            await env.run_ai_turns()
            self.assertNotEqual(env.winner, 'X')
        # Two perfect players always draw. Set O first: setting X (to move)
        # to an AI starts play, and both sides must be on hard by then.
        env = TicTacToeEnv()
        await env.set_mode(2, 'minimax', 'hard')
        await env.set_mode(1, 'minimax', 'hard')
        self.assertTrue(env.terminated)
        self.assertIsNone(env.winner)

    async def test_minimax_takes_win_and_blocks(self):
        from backend.game.agents.tictactoe_minimax import TicTacToeMinimaxPlayer
        player = TicTacToeMinimaxPlayer('hard')
        env = self.play([0, 3, 1, 4])           # X to move, wins at 2
        self.assertEqual(await player.make_move(env._get_obs()), 2)
        env = self.play([0, 4, 1])              # O to move, must block 2
        self.assertEqual(await player.make_move(env._get_obs()), 2)

    async def test_save_and_load(self):
        env = TicTacToeEnv()
        await env.set_mode(2, 'minimax', 'easy')
        env.step(4)
        loaded = game_from_dict(env.to_dict())
        self.assertIsInstance(loaded, TicTacToeEnv)
        self.assertEqual(loaded.to_dict(), env.to_dict())

    def test_old_saved_games_load_as_connect4(self):
        data = Connect4Env().to_dict()
        del data['game_type']
        self.assertIsInstance(game_from_dict(data), Connect4Env)


if __name__ == '__main__':
    unittest.main()


class TestReversi(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        from backend.game.reversi import ReversiEnv
        from backend.game import reversi_rules
        self.Env = ReversiEnv
        self.rules = reversi_rules

    def test_opening_moves(self):
        env = self.Env()
        self.assertEqual(env.counts(), {"X": 2, "O": 2})
        # Dark's four opening moves.
        self.assertEqual(sorted(env.valid_actions()), [19, 26, 37, 44])
        self.assertFalse(env._is_valid_action(0))

    def test_move_flips(self):
        env = self.Env()
        env.step(19)  # d3 for dark flips d4
        self.assertEqual(env.counts(), {"X": 4, "O": 1})
        self.assertEqual(env.current_player, 'O')

    def test_flips_in_all_directions(self):
        rules = self.rules
        cells = [0] * 64
        centre = 3 * 8 + 3
        for dr, dc in rules.DIRECTIONS:
            cells[(3 + dr) * 8 + 3 + dc] = 1          # opponent next to the centre
            cells[(3 + 2 * dr) * 8 + 3 + 2 * dc] = -1  # own disc beyond it
        self.assertEqual(len(rules.flips(cells, centre, -1)), 8)
        after = rules.play(cells, centre, -1)
        self.assertEqual(after.count(1), 0)

    def test_pass_and_game_end(self):
        env = self.Env()
        cells = [-1] * 64
        cells[0] = 0   # one empty corner...
        cells[1] = 1   # ...that dark can take by flipping this light disc
        cells[63] = 0
        cells[62] = 1
        env._set_cells(cells)
        env.current_player = 'X'
        env.step(0)
        # Light has no move (no light discs left next to a gap), so dark goes again.
        self.assertEqual(env.passed, 'O')
        self.assertEqual(env.current_player, 'X')
        self.assertFalse(env.terminated)
        env.step(63)
        self.assertTrue(env.terminated)
        self.assertEqual(env.winner, 'X')
        self.assertEqual(len(env.winning_cells), 64)

    def test_scoring_when_no_one_can_move(self):
        env = self.Env()
        env._set_cells([-1 if (i % 8) < 4 else 1 for i in range(64)])
        env._finish()
        self.assertTrue(env.terminated)
        self.assertIsNone(env.winner)  # 32-32 is a draw
        self.assertEqual(env.winning_cells, [])

    async def test_ai_plays_legal_moves_to_the_end(self):
        env = self.Env('minimax', 'random')
        await env.set_mode(1, 'minimax', 'easy')
        await env.reset_and_start()
        self.assertTrue(env.terminated)
        self.assertEqual(sum(env.counts().values()), sum(1 for row in env.board for c in row if c != ' '))

    def test_ai_prefers_a_corner(self):
        from backend.game.agents.reversi_ai import best_move
        cells = [0] * 64
        # Dark can take corner 0 (flipping 1) or play 29 (flipping 28).
        cells[1] = 1; cells[2] = -1
        cells[27] = -1; cells[28] = 1
        self.assertEqual(sorted(self.rules.legal_moves(cells, -1)), [0, 29])
        self.assertEqual(best_move(cells, -1, depth=1), 0)

    async def test_hard_ai_returns_a_legal_move_quickly(self):
        import time
        from backend.game.agents.reversi_ai import ReversiMinimaxPlayer
        env = self.Env()
        for move in [19, 18, 17, 9]:
            if env._is_valid_action(move):
                env.step(move)
        start = time.time()
        move = await ReversiMinimaxPlayer(difficulty="hard").make_move(env._get_obs(), to_move=env._player_int())
        self.assertIn(move, env.valid_actions())
        self.assertLess(time.time() - start, 5)

    def test_save_and_load(self):
        env = self.Env()
        env.step(19)
        copy = game_from_dict(env.to_dict())
        self.assertEqual(copy.board, env.board)
        self.assertEqual(copy.current_player, 'O')
        self.assertEqual(copy.game_type, 'reversi')


class TestUndoAndHistory(unittest.IsolatedAsyncioTestCase):
    def test_history_records_moves_and_cells(self):
        env = Connect4Env()
        env.step(3)
        env.step(3)
        self.assertEqual([(m["player"], m["move"], m["cell"]) for m in env.history],
                         [('X', 3, [5, 3]), ('O', 3, [4, 3])])

    def test_undo_two_humans_takes_back_one_move(self):
        env = TicTacToeEnv()
        env.step(4)
        env.step(0)
        self.assertTrue(env.undo())
        self.assertEqual(env._get_obs()[0], 0)
        self.assertEqual(env._get_obs()[4], -1)
        self.assertEqual(env.current_player, 'O')
        self.assertTrue(env.assisted)

    async def test_undo_against_ai_takes_back_the_reply_too(self):
        env = Connect4Env()
        await env.set_mode(2, 'random')
        await env.play_turn(3)
        self.assertEqual(len(env.history), 2)
        self.assertEqual([m["by"] for m in env.history], ["human", "ai"])
        self.assertTrue(env.undo())
        self.assertEqual(env.history, [])
        self.assertEqual(sum(1 for c in env._get_obs() if c), 0)
        self.assertEqual(env.current_player, 'X')

    async def test_undo_with_ai_moving_first(self):
        env = TicTacToeEnv()
        await env.set_mode(1, 'random')   # AI opens as X
        await env.play_turn(next(i for i in range(9) if env._get_obs()[i] == 0))
        self.assertEqual(len(env.history), 3)
        self.assertTrue(env.undo())
        self.assertEqual([m["by"] for m in env.history], ["ai"])
        self.assertEqual(env.current_player, 'O')

    def test_nothing_to_undo(self):
        env = Connect4Env()
        self.assertFalse(env.undo())
        self.assertFalse(env.assisted)

    def test_no_undo_after_the_game_ends(self):
        env = TicTacToeEnv()
        for move in [0, 3, 1, 4, 2]:
            env.step(move)
        self.assertTrue(env.terminated)
        self.assertFalse(env.undo())

    def test_undo_through_a_reversi_pass_and_history_survives_saving(self):
        from backend.game.reversi import ReversiEnv
        env = ReversiEnv()
        env.step(19)
        env.step(18)
        copy = game_from_dict(env.to_dict())
        self.assertEqual(copy.history, env.history)
        self.assertTrue(copy.undo())
        self.assertEqual(copy.counts(), {"X": 4, "O": 1})
