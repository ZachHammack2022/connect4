import random
from agents.player import Player

class RandomPlayer(Player):
    def __init__(self):
        super().__init__(name="random", display_name="Random")
        self.NUM_ACTIONS = 7
        
    async def make_move(self, game_env):
        await game_env.step(random.randint(0,self.NUM_ACTIONS-1))