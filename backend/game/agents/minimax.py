from backend.game.agents.player import AIPlayer
from backend.game.connect4_logic import check_positive_horizontal,check_negative_horizontal,check_vertical,check_horizontal

class MinimaxPlayer(AIPlayer):
    def __init__(self):
        super().__init__(name="minimax", display_name="Minimax")
        self.depth = 5
        # Other initialization, if needed
    
    def check_winner(self,player,board):
 
        if check_horizontal(board,player) or \
            check_vertical(board,player) or \
            check_positive_horizontal(board,player) or \
            check_negative_horizontal(board,player):
            return True
        
        return False
    
    def reconstruct_board(self,flat_board):
        rows, cols = 6, 7
        board = []

        for i in range(rows):
            row = flat_board[i * cols:(i + 1) * cols]
            board.append(row)

        return board
    
    def convert_to_symbols(self,board):
        symbol_map = {-1: 'X', 0: ' ', 1: 'O'}
        return [[symbol_map[cell] for cell in row] for row in board]

    def evaluate_board(self, board, current_player):
        opponent = 'O' if current_player == 'X' else 'X'
        player_win = self.check_winner(current_player, board)
        opponent_win = self.check_winner(opponent, board)

        if player_win:
            return 1  # Win for the current player
        elif opponent_win:
            return -1  # Loss for the current player
        else:
            return 0  # Neutral or draw state


    def is_terminal_node(self, board, current_player):
        # Check if the board is in a terminal state
        if self.evaluate_board(board, current_player) != 0:
            return True
        if len(self.get_valid_moves(board)) == 0:
            return True
        return False
        

    def get_valid_moves(self, board):
        # Get a list of valid moves (column indices) that can be played
        actions = []
        for action in [0,1,2,3,4,5,6]:
            if self._is_valid_action(action,board):
                actions.append(action)
        return actions

    def minimax(self, board, depth, alpha, beta, maximizing_player, current_player):
        if depth == 0 or self.is_terminal_node(board, current_player):
            return self.evaluate_board(board, current_player)

        if maximizing_player:
            max_eval = float('-inf')
            for move in self.get_valid_moves(board):
                new_board = self.simulate_move(board, move, current_player)
                evaluation = self.minimax(new_board, depth - 1, alpha, beta, False, current_player)
                max_eval = max(max_eval, evaluation)
                alpha = max(alpha, evaluation)
                if beta <= alpha:
                    break
            return max_eval  # Correctly indented
        else:
            min_eval = float('inf')
            opponent = 'O' if current_player == 'X' else 'X'
            for move in self.get_valid_moves(board):
                new_board = self.simulate_move(board, move, opponent)
                evaluation = self.minimax(new_board, depth - 1, alpha, beta, True, current_player) # was opponent, think it should be current player
                min_eval = min(min_eval, evaluation)
                beta = min(beta, evaluation)
                if beta <= alpha:
                    break
            return min_eval  # Correctly indented

    
    def simulate_move(self, board, move, player):
        # Assuming move is the column number and player is either 'X' or 'O'
        new_board = [row[:] for row in board]  # Deep copy of the board
        for row in reversed(new_board):
            if row[move] == ' ':  # Find the first empty slot in the column
                row[move] = player
                break
        return new_board



    async def make_move(self, obs):
        # Convert the observation to a board state
        board = self.obs_to_board(obs)

        # Determine if the Minimax player is 'X' or 'O'
        num_X = sum(cell == 'X' for row in board for cell in row)
        num_O = sum(cell == 'O' for row in board for cell in row)
        self.current_player = 'X' if num_X == num_O else 'O'

        # Initialize variables to store the best score and the corresponding best move
        best_score = float('-inf') if self.current_player == 'X' else float('inf')
        best_move = None

        # Iterate over all valid moves to find the best one
        for move in self.get_valid_moves(board):
            # Simulate the move on a copy of the board
            temp_board = self.simulate_move(board, move, self.current_player)

            # Use the minimax algorithm to evaluate the move
            score = self.minimax(temp_board, self.depth, float('-inf'), float('inf'),True,self.current_player)

            # Update the best score and move if this move is better
            if self.current_player == 'X' and score > best_score:
                best_score = score
                best_move = move
            elif self.current_player == 'O' and score < best_score:
                best_score = score
                best_move = move

        # Return the best move found
        return best_move



    def obs_to_board(self, obs):
        # Convert the observation to your board representation
        return self.convert_to_symbols(self.reconstruct_board(obs))
    
    def _is_valid_action(self, action,board):
        return board[0][action] == ' ' 

if __name__ == '__main__':
    board = [0,0,0,0,-1,0,0, \
             0,0,0,0,1,0,0, \
             0,0,0,0,-1,0,0, \
             0,0,0,0,1,0,0, \
             0,0,0,0,-1,0,0, \
             0,0,0,0,1,0,-1, \
            ]
    player = MinimaxPlayer()
    print(player.obs_to_board(board))
    new_board = player.obs_to_board(board)

    print(f"valid moves: {player.get_valid_moves(new_board)}")