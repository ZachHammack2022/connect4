from agents.player import Player

class HumanPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        
    async def make_move(self, game_env):
        valid_move = False
        game_env.render()
        while not valid_move:
            try:
                action = int(input(f"Player {game_env.current_player}, choose a column (0-6): "))
                if 0 <= action < game_env.NUM_MOVES and game_env._is_valid_action(action):
                    valid_move = True
                else:
                    print("Invalid move. Try again.")
            except ValueError:
                print("Invalid input. Please enter a number.")
        await game_env.step(action)
