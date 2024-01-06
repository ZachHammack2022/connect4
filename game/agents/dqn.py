import random
from agents.player import Player

class DQNPlayer(Player):
    def __init__(self):
        super().__init__(name="random", display_name="Random")
        self.NUM_ACTIONS = 7
        
    async def make_move(self, obs):
        return random.randint(0,self.NUM_ACTIONS-1)