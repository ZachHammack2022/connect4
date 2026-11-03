from backend.game.agents.random import RandomPlayer


class DQNPlayer(RandomPlayer):
    """Placeholder until the trained DQN model is wired in: plays random valid moves."""
    def __init__(self, difficulty=None):
        super().__init__(name="dqn", display_name="DQN")
