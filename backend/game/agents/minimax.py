from backend.game.agents.player import AIPlayer

class MinimaxPlayer(AIPlayer):
    def __init__(self):
        super().__init__(name="minimax", display_name="Minimax")
        self.depth = 5
        # Other initialization, if needed

    def evaluate_board(self, board):
        # Evaluate the board and return a score
        pass

    def is_terminal_node(self, board):
        # Check if the board is in a terminal state
        pass

    def get_valid_moves(self, board):
        # Get a list of valid moves (column indices) that can be played
        pass

    def minimax(self, board, depth, alpha, beta, maximizingPlayer):
        # Implement the minimax algorithm with alpha-beta pruning
        pass

    async def make_move(self, obs):
        # # Convert obs to board state if necessary
        # board = self.obs_to_board(obs)

        # best_score = float('-inf')
        # best_move = None
        # for move in self.get_valid_moves(board):
        #     # Copy the board and simulate the move
        #     temp_board = board.copy()
        #     temp_board.play_move(move, self.current_player)
        #     score = self.minimax(temp_board, self.depth, float('-inf'), float('inf'), True)
        #     if score > best_score:
        #         best_score = score
        #         best_move = move
        # return best move 
        return 1

    def obs_to_board(self, obs):
        # Convert the observation to your board representation
        pass
