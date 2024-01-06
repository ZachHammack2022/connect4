from backend.game.agents.player import Player
class HumanPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        self.NUM_MOVES = 7
        self.NUM_ROWS = 6
        
    async def make_move(self, obs):
        valid_move = False
        while not valid_move:
            try:
                action = int(input(f"Choose a column (0-6): "))
                if 0 <= action < self.NUM_MOVES:
                    # Check if the action is valid based on the observation
                    if self.is_valid_action(action, obs):
                        valid_move = True
                    else:
                        print("Invalid move. Try again.")
                else:
                    print(f"Action must be between 0 and {self.NUM_MOVES - 1}.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        return action
    ##TODO implement action validation for human (god for checking, but already checked by frontend)
    def is_valid_action(self, action, observation):
            return True