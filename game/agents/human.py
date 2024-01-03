from agents.player import Player
class HumanPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        self.NUM_MOVES = 7
        self.NUM_ROWS = 6
        
    async def make_move(self, observation):
        valid_move = False
        while not valid_move:
            try:
                action = int(input(f"Choose a column (0-6): "))
                if 0 <= action < self.NUM_MOVES:
                    # Check if the action is valid based on the observation
                    if self.is_valid_action(action, observation):
                        valid_move = True
                    else:
                        print("Invalid move. Try again.")
                else:
                    print(f"Action must be between 0 and {self.NUM_MOVES - 1}.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        return action

    def is_valid_action(self, action, observation):
            # Calculate the index to check in the observation array
            index_to_check = action * self.NUM_ROWS + (self.NUM_ROWS - 1)
            
            # Traverse back through the column to find the first empty cell
            for row in range(self.NUM_ROWS):
                if observation[index_to_check - row * self.NUM_MOVES] == 0:
                    return True

            # If no empty cell is found in the column, the move is invalid
            return False