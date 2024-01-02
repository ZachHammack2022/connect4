from player import Player
import random

class RandomPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        
    def make_move(self, game_env):
        return random.randint(0, 7) # temporary hardcode