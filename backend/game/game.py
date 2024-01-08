import gym
from gym import spaces
import random
import asyncio
from backend.game.connect4_logic import check_negative_horizontal, check_positive_horizontal, check_vertical, check_horizontal
from backend.game.agents.random import RandomPlayer
from backend.game.agents.human import HumanPlayer
from backend.game.agents.mcts import MCTSPlayer
from backend.game.agents.dqn import DQNPlayer
from backend.game.agents.player import AIPlayer
from backend.game.agents.minimax import MinimaxPlayer

class Connect4Env(gym.Env):
    def __init__(self,player1='human',player2 ='human'):
        super(Connect4Env, self).__init__()
        self.NUM_MOVES = 7
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.action_space = spaces.Discrete(self.NUM_MOVES)
        self.observation_space = spaces.Box(low=0, high=1, shape=(42,), dtype=float)
        self.terminated = False
        self.winner = None
        self.player_modes = {
            'human': HumanPlayer,
            'random': RandomPlayer,
            'dqn': DQNPlayer,
            'mcts': MCTSPlayer,
            'minimax': MinimaxPlayer
        }
        player1class = self.player_modes[player1]
        player2class = self.player_modes[player2]

        self.player1 = player1class()
        self.player2 = player2class()
        
    def seed(self, seed=None):
        random.seed(seed)
    
    async def set_mode(self, player_number, player_mode):
        print(player_number,player_mode)
        if player_mode not in self.player_modes:
            raise ValueError(f"Invalid player type: {player_mode}")

        player_class = self.player_modes[player_mode]
        if player_number == 1:
            self.player1 = player_class()
        elif player_number == 2:
            self.player2 = player_class()  
        else:
            raise ValueError("Invalid player number")
        
        if self.check_if_ai_move():
            await self.run_ai_turns()
        
    def step(self, action):
        # Check if action is valid
        if not self._is_valid_action(action):
            return self._get_obs(), -2, True, {"msg": "Invalid action, column full."}
        
        # Check if the game is already terminated
        if self.terminated:
            return self._get_obs(), -10, self.terminated, {"msg": "Game terminated."}
        
        # Make the move for the current player
        self._make_move(action)
        
        # Check if the move resulted in a win
        won = self.check_winner(self.current_player)
        if won:
            self.winner = self.current_player
            self.terminated = True
            reward = 100
        else:
            reward = 0.01
            self.terminated = self._is_board_full()
            if not self.terminated:
                # Switch player only if no win and the board is not full
                self.switch_player()

        # Return the updated game state
        return self._get_obs(), reward, self.terminated, {"winner": self.winner}

    async def ai_move(self,ai_player):
        # Get the observation for the current AI player
        ai_observation = self._get_obs()

        # Make the AI player's move
        ai_action = await ai_player.make_move(ai_observation)

        # Call the step function again for the AI's move
        obs, reward, self.terminated, info = self.step(ai_action)

        return (obs, reward, self.terminated, info)
    
    def get_ai_player(self):
        if self.current_player == 'X' and isinstance(self.player1, AIPlayer):
            ai_player = self.player1
        elif self.current_player == 'O' and isinstance(self.player2, AIPlayer):
            ai_player = self.player2
        return ai_player
            
    def check_if_ai_move(self):
        if self.current_player == 'X' and isinstance(self.player1, AIPlayer):
            return True
        elif self.current_player == 'O' and isinstance(self.player2, AIPlayer):
            return True
        
        return False
    
    async def run_ai_turns(self):
        while not self.terminated:
            if not self.check_if_ai_move():
                break
           
            ai_player = self.get_ai_player()
            obs, reward, self.terminated, info = await self.ai_move(ai_player)
            
            # Exit the loop if the game has terminated
            if self.terminated:
                break
    
        return obs, reward, self.terminated, info
        
    async def play_turn(self, action):
        # Call the basic step function, which is synchronous in this case
        obs, reward, self.terminated, info = self.step(action)
        
        if self.check_if_ai_move() and not self.terminated:
            obs, reward, self.terminated, info = await self.run_ai_turns()
            
        return obs, reward, self.terminated, info

    
    def reset(self):
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.terminated = False
        self.winner = None
        return self._get_obs()

    def switch_player(self):
        self.current_player = 'O' if self.current_player == 'X' else 'X'
# Only functions above this line should change
#------------------------------------#
    def render(self, mode='human', close=False):
        if close:
            return
        print(" 0 1 2 3 4 5 6")
        for row in self.board:
            print('|' + '|'.join(row) + '|')

    def close(self):
        pass

    # Additional methods (private)
    def _make_move(self, column):
        for row in reversed(self.board):
            if row[column] == ' ':
                row[column] = self.current_player
                break

    def _get_obs(self):
        # Using 1 for 'X' and 2 for 'O' as current player
        # current_player_num = 0 if self.current_player == 'X' else 1

        # Flatten the board into a 1D array and prepend the current player
        flat_board = []
        for row in self.board:
            for cell in row:
                if cell == ' ':
                    flat_board.append(0)
                elif cell == 'X':
                    flat_board.append(0.5)
                else:  # 'O'
                    flat_board.append(1)

        return flat_board

    def _is_valid_action(self, action):
        return self.board[0][action] == ' ' 

    def _is_board_full(self):
        return all(cell != ' ' for row in self.board for cell in row)


    def display_board(self):
        print(" 0 1 2 3 4 5 6")
        for row in self.board:
            print('|' + '|'.join(row) + '|')
    
    def check_winner(self,player):
 
        if check_horizontal(self.board,player) or \
            check_vertical(self.board,player) or \
            check_positive_horizontal(self.board,player) or \
            check_negative_horizontal(self.board,player):
            return True
        
        return False
    
async def main():
    # Initialize players
    player1 = "human"
    player2 = "human"

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
            action = await current_player.make_move(observation)
            _, reward, terminated, _ = await env.play_turn(action)
        else:
            # If the current player is AI, play_turn will handle it
            # No need to get a specific action, just pass None
            _, reward, terminated, _ = await env.play_turn(None)

        env.render()

        if env.terminated:
            print(f"Game Over. Winner: {env.winner}")
            break

if __name__ == "__main__":
    asyncio.run(main())