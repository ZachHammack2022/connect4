from tqdm import tqdm
import torch
import numpy as np
# from plots import plot_training_rewards,
from utils import  save_episode_data, check_dir 
import os
from game.game import Connect4Env
from dqn import QLearningAgent
from plots import plot_training_lengths


### Train your agent ###
def train_agent(env,agents, num_episodes,output_dir="output", debug=False):
    agent0,agent1 = agents
    alg_name = agent0.name
    full_output_dir = os.path.join(output_dir,alg_name)

    # check_dir(full_output_dir)

    if not os.path.exists(full_output_dir):
        os.makedirs(full_output_dir)

    # # tracked over all episodes for plots
    all_lengths = [] 
    
    
    model_update_frequency = 5
    output_frequency = 1000
    

    for episode in tqdm(range(num_episodes), desc="Training Progress", ascii=True):

        # Episode termination flag
        terminated = False

        state = env.reset()
        if debug:
            print(f"state: {state}")
        
   
        step = 0
        old_action,old_state = None,None
        if episode ==10 and debug:
            debug = False
        while not terminated:
            
            valid = False
            count = 0
            while not valid and count <3:
                if step %2 ==0:
                    
                    action = agent0.find_action(state)
                    if debug:
                        print(f"agent 0 attempted action: {action}")
                else:
                    action = agent1.find_action(state)
                    if debug:
                        print(f"agent 1 attempted action: {action}")
                    
                    
                valid =  env._is_valid_action(action)
                count +=1
                
      
            
            new_state, reward, terminated, info = env.step(action)
            if debug:
                print(reward,terminated,info)
            if step %2 ==0:
                agent0.replay_buffer.push(state, action, reward, new_state, terminated)
            else:
                agent1.replay_buffer.push(state, action, reward, new_state, terminated)
            
            if step > 0 and env.winner is not None:
                if debug:
                    print(f"winner: {env.winner}")
                if step %2 ==0:
                    if debug:
                        print(f"agent0 won. Push a losing memory to agent1 replay buffer.")
                    agent1.replay_buffer.push(old_state, old_action, - reward, state, terminated)
                else:
                    if debug:
                        print(f"agent1 won. Push a losing memory to agent0 replay buffer.")
                    agent0.replay_buffer.push(old_state, old_action, - reward, state, terminated)
            
            if episode % model_update_frequency == 0 and episode != 0:
                agent0.update_model()
                agent1.update_model()
                
            old_state = state
            old_action = action
            state = new_state
            step +=1
            
        all_lengths.append(step)
        
        if episode % agent0.target_update_freq == 0:
            agent0.target_model.load_state_dict(agent0.model.state_dict())
            agent1.target_model.load_state_dict(agent1.model.state_dict())
            
        if episode % output_frequency == 0 and episode != 0:
            folder_name = f"{full_output_dir}/episode_{episode}"
            # Check if the directory exists, and if not, create it
            check_dir(folder_name)
            agent0.save_model_weights(folder_name,0)
            agent1.save_model_weights(folder_name,1)
            print(f"epsilon: {agent0.epsilon}")
            plot_training_lengths(plot_path=folder_name,lengths=all_lengths,rolling_window=output_frequency)
            env.render()
            
    
            # # save rewards info
            # rewards_plot_path = folder_name + '/rolling_average.png'
            # save_episode_data(recent_episodes, recent_a0_rewards, recent_a1_rewards, recent_combined_rewards, recent_soups, folder_name)
      

            # plots

            # reset episode stats
            # recent_episodes = []
            # recent_a1_rewards = []
            # recent_a0_rewards = []

if __name__ =="__main__":
    env = Connect4Env()
    agent0 = QLearningAgent(0.0001,16,10000)
    agent1 = QLearningAgent(0.0001,16,10000)
    agents = [agent0,agent1]
    train_agent(env,agents,1000000,debug=True)
    