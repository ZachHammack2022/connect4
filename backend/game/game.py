import gymnasium as gym
from gymnasium import spaces
import random
import asyncio
from backend.game.base import TurnBasedGame
from backend.game.connect4_logic import find_winning_line
from backend.game.agents.random import RandomPlayer
from backend.game.agents.human import HumanPlayer
from backend.game.agents.mcts import MCTSPlayer
from backend.game.agents.dqn import DQNPlayer
from backend.game.agents.minimax import MinimaxPlayer

class Connect4Env(TurnBasedGame, gym.Env):
    game_type = "connect4"
    ROWS, COLS = 6, 7
    NUM_MOVES = 7
    player_modes = {
        'human': HumanPlayer,
        'random': RandomPlayer,
        'dqn': DQNPlayer,
        'mcts': MCTSPlayer,
        'minimax': MinimaxPlayer,
    }

    def __init__(self, player1='human', player2='human'):
        gym.Env.__init__(self)
        TurnBasedGame.__init__(self, player1, player2)
        self.action_space = spaces.Discrete(self.NUM_MOVES)
        self.observation_space = spaces.Box(low=-1, high=1, shape=(self.ROWS * self.COLS,), dtype=float)

    def seed(self, seed=None):
        random.seed(seed)

    @property
    def num_actions(self):
        return self.NUM_MOVES

    def _is_valid_action(self, action):
        return isinstance(action, int) and 0 <= action < self.NUM_MOVES and self.board[0][action] == ' '

    def _make_move(self, column):
        for row in reversed(self.board):
            if row[column] == ' ':
                row[column] = self.current_player
                break

    def find_winning_cells(self, player):
        return find_winning_line(self.board, player)

    def close(self):
        pass

    def reconstruct_board(self, flat_board):
        return [flat_board[i * self.COLS:(i + 1) * self.COLS] for i in range(self.ROWS)]

    def convert_to_symbols(self, board):
        symbol_map = {-1: 'X', 0: ' ', 1: 'O'}
        return [[symbol_map[cell] for cell in row] for row in board]


async def main():
    # Initialize players
    player1 = "human"
    player2 = "minimax"

    # Set up the game environment
    env = Connect4Env(player1, player2)
    env.reset()
    env.render()

    # Game loop
    while not env.terminated:
        current_player = env.player1 if env.current_player == 'X' else env.player2
        
        # Check if the current player is human and requires input
        if isinstance(current_player, HumanPlayer):
            observation = env._get_obs()
            new_board = env.convert_to_symbols(env.reconstruct_board(observation))
            if env.board != new_board:
                print(env.board,new_board)
                print("error, not the same as board")
            action = await current_player.make_move(observation)
            _, reward, terminated, _ = await env.play_turn(action)
        else:
            # If the current player is AI, play_turn will handle it
            # No need to get a specific action, just pass None
            _, reward, terminated, _ = await env.play_turn(None)
        print(env.board)
        print([env._is_valid_action(action) for action in [0,1,2,3,4,5,6]])
        env.render()

        if env.terminated:
            print(f"Game Over. Winner: {env.winner}")
            break

if __name__ == "__main__":
    asyncio.run(main())