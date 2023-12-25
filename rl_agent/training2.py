import os
import gym
from stable_baselines3 import DQN
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import CheckpointCallback
# from stable_baselines3.common.policies import MlpPolicy
from game.game import Connect4Env
from stable_baselines3 import PPO


def train_agent(env, num_episodes, output_dir="output"):
    # Create a vectorized environment
    env = make_vec_env(lambda: env, n_envs=1)

    # Define the DQN agent with MultiInputPolicy
    model = PPO('MlpPolicy', env, verbose=1)


    # Checkpoint callback to save the model
    checkpoint_callback = CheckpointCallback(save_freq=1000, save_path=output_dir,
                                             name_prefix='dqn_model')

    # Train the agent
    model.learn(total_timesteps=num_episodes, callback=checkpoint_callback)
    model.save(os.path.join(output_dir, "final_model"))

if __name__ =="__main__":
    env = Connect4Env()
    num_episodes = 1000000  # Total number of timesteps to train
    train_agent(env, num_episodes)
