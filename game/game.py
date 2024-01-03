import gym
from gym import spaces
import random
import asyncio
from connect4_logic import check_negative_horizontal, check_positive_horizontal, check_vertical, check_horizontal
from agents.random import RandomPlayer
from agents.human import HumanPlayer

class Connect4Env(gym.Env):
    def __init__(self,player1, player2):
        super(Connect4Env, self).__init__()
        self.NUM_MOVES = 7
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.action_space = spaces.Discrete(self.NUM_MOVES)
        self.observation_space = spaces.Box(low=0, high=1, shape=(42,), dtype=float)
        self.terminated = False
        self.winner = None
        self.player1 = player1
        self.player2 = player2
        
    def seed(self, seed=None):
        random.seed(seed)
    
    def set_player(self, player_number, player_type):
        if player_number == 1:
            self.player1 = player_type
        elif player_number == 2:
            self.player2 = player_type
        else:
            raise ValueError("Invalid player number")

    async def step(self, action):
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

        # Trigger AI's move if the next player is an AI
        if not self.terminated:
            current_player = self.player1 if self.current_player == 'X' else self.player2
            if isinstance(current_player, RandomPlayer):
                await current_player.make_move(self)

        # Return the updated game state
        return self._get_obs(), reward, self.terminated, {"winner": self.winner}


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
    
async def main():
    # Initialize players
    player1 = HumanPlayer()
    player2 = RandomPlayer()

    # Set up the game environment
    env = Connect4Env(player1, player2)
    env.reset()

    # Game loop
    while not env.terminated:
        current_player = env.player1 if env.current_player == 'X' else env.player2

        # Await the current player's move
        await current_player.make_move(env)

        # Check for game termination
        if env.terminated:
            print(f"Game Over. Winner: {env.winner}")
            break


if __name__ == "__main__":
    asyncio.run(main())