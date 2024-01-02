from player import Player

class HumanPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        
    def make_move(self, game_env):
        pass

