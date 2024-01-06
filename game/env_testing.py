import unittest
from game import Connect4Env

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


if __name__ == '__main__':
    unittest.main()
