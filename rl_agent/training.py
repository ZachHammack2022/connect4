import gym
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.evaluation import evaluate_policy
from game.game import Connect4Env  # Import your Connect4Env

# Initialize the environment
env = make_vec_env(lambda: Connect4Env(), n_envs=1)

# Define the model
model = PPO('MlpPolicy', env, verbose=1)

# Train the model
model.learn(total_timesteps=100000)

# Evaluate the trained agent
mean_reward, std_reward = evaluate_policy(model, model.get_env(), n_eval_episodes=10)
print(f"Mean reward: {mean_reward}, std: {std_reward}")

# Save the model
model.save("ppo_connect4")

# To load the model:
# model = PPO.load("ppo_connect4")
