import random
from player import Player
from game.game import Connect4Env

class RandomPlayer(Player):
    def __init__(self):
        super().__init__(name="human", display_name="Human")
        
    def make_move(self, game_env:Connect4Env):
        action = random.randint(0, game_env.NUM_MOVES)
        game_env.step(action)