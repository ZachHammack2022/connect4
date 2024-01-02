import gym
from gym import spaces
import random

class Connect4Env(gym.Env):
    def __init__(self):
        super(Connect4Env, self).__init__()
        self.NUM_MOVES = 7
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.action_space = spaces.Discrete(self.NUM_MOVES)
        self.observation_space = spaces.Box(low=0, high=1, shape=(42,), dtype=float)
        self.terminated = False
        self.winner = None
        self.mode = "human" # human or computer
    
    def seed(self, seed=None):
        random.seed(seed)
    
    def set_mode(self,mode):
        self.mode = mode

    def step(self, action):
        # Check if action is valid
        if not self._is_valid_action(action):
            return self._get_obs(), -2, True, {"msg": "Invalid action, column full."}
        if self.terminated:
            return self._get_obs(), -10, self.terminated, {"msg": "Game terminated."}
            
        self._make_move(action)
        
        # Check if the move resulted in a win
        won = self.check_winner(self.current_player)
        if won:
            self.winner = self.current_player
            self.terminated = True
            reward = 100
        else:
            self.terminated = self._is_board_full()
            if self.terminated:
                reward = 10
            else:
                reward = 0.01
                self.switch_player()  # Switch player only if no win

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
                print(f"Player {env.winner} wins!")  # Use env.winner to announce the winner
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