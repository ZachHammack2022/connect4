class Player:
    def __init__(self, name, display_name):
        self.name = name
        self.display_name = display_name

    async def make_move(self, obs):
        raise NotImplementedError


class AIPlayer(Player):
    pass
