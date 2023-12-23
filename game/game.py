import gym
from gym import spaces
import random

class Connect4Env(gym.Env):
    def __init__(self):
        super(Connect4Env, self).__init__()
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.action_space = spaces.Discrete(7)  # 7 columns
        self.observation_space = spaces.Box(low=0, high=2, shape=(6, 7), dtype=int)
        self.terminated = False
        self.winner = None
        
    def seed(self, seed=None):
        random.seed(seed)

    def step(self, action):
        # Check if action is valid
        if not self._is_valid_action(action):
            return self._get_obs(), -10, self.terminated, {"msg": "Invalid action, column full."}
        if self.terminated:
            return self._get_obs(), -10, self.terminated, {"msg": "Game terminated."}
            
        player_who_moved = self.current_player
        self._make_move(action)
        
        # Check if the move resulted in a win
        won = self.check_winner(player_who_moved)
        if won:
            self.winner = player_who_moved
        self.terminated = won or self._is_board_full()
    
        # If the game is won, reward should be 1, otherwise 0
        reward = 1 if won else 0

        return self._get_obs(), reward, self.terminated, {}


    def reset(self):
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.terminated = False
        self.winner = None
        return self._get_obs()

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
        self.switch_player()

    def _get_obs(self):
        # Transform the board into a numerical array for the observation space
        obs = []
        for row in self.board:
            obs_row = []
            for cell in row:
                if cell == ' ':
                    obs_row.append(0)
                elif cell == 'X':
                    obs_row.append(1)
                else:  # 'O'
                    obs_row.append(2)
            obs.append(obs_row)
        return obs

    def _is_valid_action(self, action):
        return self.board[0][action] == ' ' 

    def _is_board_full(self):
        return all(cell != ' ' for row in self.board for cell in row)


    def display_board(self):
        print(" 0 1 2 3 4 5 6")
        for row in self.board:
            print('|' + '|'.join(row) + '|')

    # def make_move(self, column):
    #     for row in reversed(self.board):
    #         if row[column] == ' ':
    #             row[column] = self.current_player
    #             return True
    #     return False
    
    def check_horizontal(self,player):
        # Check horizontal
        for row in range(6):
            for col in range(4):
                if self.board[row][col] == player and \
                   self.board[row][col+1] == player and \
                   self.board[row][col+2] == player and \
                   self.board[row][col+3] == player:
                    return True
                
    def check_vertical(self,player): 
        # Check vertical
        for col in range(7):
            for row in range(3):
                if self.board[row][col] == player and \
                   self.board[row+1][col] == player and \
                   self.board[row+2][col] == player and \
                   self.board[row+3][col] == player:
                    return True   
    
    def check_positive_horizontal(self,player): 
        # Check positive diagonal
        for col in range(4):
            for row in range(3, 6):
                if self.board[row][col] == player and \
                   self.board[row-1][col+1] == player and \
                   self.board[row-2][col+2] == player and \
                   self.board[row-3][col+3] == player:
                    return True
                
    def check_negative_horizontal(self,player): 
        # Check negative diagonal
        for col in range(4):
            for row in range(3):
                if self.board[row][col] == player and \
                   self.board[row+1][col+1] == player and \
                   self.board[row+2][col+2] == player and \
                   self.board[row+3][col+3] == player:
                    return True
        

    def check_winner(self,player):
 
        if self.check_horizontal(player) or \
            self.check_vertical(player) or \
            self.check_positive_horizontal(player) or \
            self.check_negative_horizontal(player):
            return True
        
        return False

    def switch_player(self):
        self.current_player = 'O' if self.current_player == 'X' else 'X'

def play_game(env):
    _ = env.reset()
    done = False

    while not done:
        env.render()
        valid_move = False

        while not valid_move:
            try:
                action = int(input(f"Player {env.current_player}, choose a column (0-6): "))
                if action < 0 or action > 6:
                    raise ValueError

                # Check if the column is full
                if env.board[0][action] != ' ':
                    print("Column is full. Try a different one.")
                else:
                    valid_move = True

            except ValueError:
                print("Invalid column. Try again.")

        _, reward, done, info = env.step(action)

        if done:
            env.render()
            if reward == 1:
                print(f"Player {env.current_player} wins!")
            else:
                print("Game over!")

def random_agent_test(env,render=True):
    _ = env.reset()
    done = False
    while not done:
        if render:
            env.render()
        action = random.choice([i for i in range(7) if env._is_valid_action(i)])
        _, _, done, _ = env.step(action)
    assert done  # Ensure the game ends

if __name__ == "__main__":
    env = Connect4Env()
    play_game(env)
    # random_agent_test(env)
