import unittest
from backend.game.game import Connect4Env
from backend.game.agents.minimax import MinimaxPlayer

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


if __name__ == '__main__':
    unittest.main()
