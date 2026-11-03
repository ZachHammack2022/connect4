from backend.game.agents.random import RandomPlayer


class MCTSPlayer(RandomPlayer):
    """Placeholder until MCTS is implemented: plays random valid moves."""
    def __init__(self):
        super().__init__(name="mcts", display_name="MCTS")
