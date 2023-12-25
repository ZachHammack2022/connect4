import torch
from dqn import QLearningAgent
from game.game import Connect4Env
import os

# def load_agent(model_path):
#     agent = QLearningAgent(0.001, 16, 100000)  # Ensure the architecture matches
#     agent.model.load_state_dict(torch.load(model_path))
#     agent.model.eval()  # Set the model to evaluation mode
#     return agent

def load_model_weights(path):
    agent = QLearningAgent(0.001, 16, 100000)
    model_weights = torch.load(path)
    agent.model.load_state_dict(model_weights)
    agent.model.eval()
    return agent

def play_game(env, model):
    state = env.reset()
    done = False

    while not done:
        env.render()

        if env.current_player == 'X':  # Assuming 'X' is the human player
            valid_move = False
            while not valid_move:
                try:
                    action = int(input(f"Player {env.current_player}, choose a column (0-6): "))
                    if action < 0 or action > 6:
                        raise ValueError

                    if env.board[0][action] != ' ':
                        print("Column is full. Try a different one.")
                    else:
                        valid_move = True
                except ValueError:
                    print("Invalid column. Try again.")
        else:
            # The agent (model) makes a move
            print(state)
            action= model.find_greedy_action(state)
            print(f"Agent chooses column: {action}")

        state, reward, done, info = env.step(action)
        print(env.current_player)

        if done:
            env.render()
            if reward == 1:
                print(f"Player {env.winner} wins!")
            else:
                print("Game over!")
            break


if __name__ == "__main__":
    env = Connect4Env()
    agent_model_path = '/Users/zhammack/Downloads/cs/connect4/rl_agent/output/dqn/episode_99000/model_weights.pth'
    agent = load_model_weights(agent_model_path)
    for i in range(10):
        play_game(env, agent)
