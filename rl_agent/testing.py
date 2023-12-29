import torch
from dqn import QLearningAgent
from game.game import Connect4Env

def load_model_weights(path):
    agent = QLearningAgent(0.001,8,5000)
    model_weights = torch.load(path, map_location=torch.device('cpu'))  # Add map_location if using CPU
    agent.model.load_state_dict(model_weights)
    agent.model.eval()
    return agent

def play_game(env, agent1, agent2):
    state = env.reset()
    done = False

    while not done:
        env.render()
        current_player = env.current_player
        action = None

        if current_player == 'X':  # Assuming 'X' is the first agent
            if agent1 is None:  # Human player
                valid_move = False
                while not valid_move:
                    try:
                        action = int(input(f"Player X, choose a column (0-6): "))
                        if action < 0 or action > 6 or env.board[0][action] != ' ':
                            raise ValueError
                        valid_move = True
                    except ValueError:
                        print("Invalid column. Try again.")
            else:  # Second agent
                action = agent1.find_greedy_action(state)
                print(f"Agent X chooses column: {action}")
        elif current_player == 'O':  # Assuming 'O' is the human or the second agent
            if agent2 is None:  # Human player
                valid_move = False
                while not valid_move:
                    try:
                        action = int(input(f"Player O, choose a column (0-6): "))
                        if action < 0 or action > 6 or env.board[0][action] != ' ':
                            raise ValueError
                        valid_move = True
                    except ValueError:
                        print("Invalid column. Try again.")
            else:  # Second agent
                action = agent2.find_greedy_action(state)
                print(f"Agent O chooses column: {action}")

        state, reward, done, info = env.step(action)

        if done:
            env.render()
            if reward == 1:
                print(f"Player {env.winner} wins!")
            else:
                print("Game over!")
            break

if __name__ == "__main__":
    env = Connect4Env()
    agent1_model_path = '/Users/zhammack/Downloads/cs/connect4/rl_agent/output/dqn/episode_99000/0model_weights.pth'
    agent2_model_path = '/Users/zhammack/Downloads/cs/connect4/rl_agent/output/dqn/episode_99000/1model_weights.pth'

    agent1 = load_model_weights(agent1_model_path)  # First agent
    agent2 = load_model_weights(agent2_model_path)  # Second agent

    # Play as Player 2 against the first agent
    env.current_player = 'X'  # Ensure the first agent starts as 'X'
    play_game(env, agent1, None)

    # Play as Player 1 against the second agent
    env.current_player = 'O'  # Ensure the second agent starts as 'O'
    play_game(env, None, agent2)
