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
