from tqdm import tqdm
import torch
import numpy as np
# from plots import plot_training_rewards,
from utils import  save_episode_data, check_dir 
import os
from game.game import Connect4Env
from dqn import QLearningAgent
# from plots import plot_activity_counts

### Train your agent ###
def train_agent(env,agent, num_episodes,output_dir="output"):
    alg_name = agent.name
    full_output_dir = os.path.join(output_dir,alg_name)

    # check_dir(full_output_dir)

    if not os.path.exists(full_output_dir):
        os.makedirs(full_output_dir)

    # # tracked over all episodes for plots
    # all_rewards = [] 
    
    
    model_update_frequency = 5
    output_frequency = 100

    # # reset episode stats
    # recent_episodes = []
    # recent_a0_rewards = []
    # recent_a1_rewards = []
    

    for episode in tqdm(range(num_episodes), desc="Training Progress", ascii=True):

        # Episode termination flag
        terminated = False

        # # tracked per episode for recent_episode stats
        # episode_reward = 0
        # episode_a0 = 0
        # episode_a1 = 0


        state_dict = env.reset()
        
        # start with turn_index = 0
        turn_idx = 0
        step = 0
        old_action,old_state_dict = None,None
        while not terminated:
            
            
            action = agent.find_action(turn_idx,state_dict["board"])
            
            new_state_dict, reward, terminated, info = env.step(action)
            
            if step > 0:
                agent.replay_buffer.push(state_dict, action, reward, new_state_dict, terminated)
                agent.replay_buffer.push(old_state_dict, old_action, - reward, state_dict, terminated)
            
            if episode % model_update_frequency == 0 and episode != 0:
                agent.update_model()
                
            old_state_dict = state_dict
            old_action = action
            state_dict = new_state_dict
            step +=1
            
            # switch agent
            if turn_idx==0:
                turn_idx = 1
            else:
                turn_idx = 0

        # all_rewards.append(episode_reward)
 
    

        if episode % agent.target_update_freq == 0:
            agent.target_model.load_state_dict(agent.model.state_dict())
            
        if episode % output_frequency == 0 and episode != 0:
            folder_name = f"{full_output_dir}/episode_{episode}"
            # Check if the directory exists, and if not, create it
            check_dir(folder_name)
            agent.save_model_weights(folder_name)
            print(f"epsilon: {agent.epsilon}")
            
    
            # # save rewards info
            # rewards_plot_path = folder_name + '/rolling_average.png'
            # save_episode_data(recent_episodes, recent_a0_rewards, recent_a1_rewards, recent_combined_rewards, recent_soups, folder_name)
      

            # plots
            # plot_training_rewards(plot_path=rewards_plot_path,rewards=all_rewards,rolling_window=output_frequency)

            # reset episode stats
            # recent_episodes = []
            # recent_a1_rewards = []
            # recent_a0_rewards = []

if __name__ =="__main__":
    env = Connect4Env()
    agent = QLearningAgent(0.001,16,100000)
    train_agent(env,agent,10000)
    