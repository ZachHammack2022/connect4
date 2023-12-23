from tqdm import tqdm
import torch
import numpy as np
# from plots import plot_training_rewards, plot_training_soups
# from utils import  save_episode_data,save_soups, check_dir,  extract_onion_soup_dish_stats, save_activities_to_json
import os
# from plots import plot_activity_counts

### Train your agent ###
def train_agent(env,agent, num_episodes,layout,output_dir="output"):
    alg_name = agent.name
    full_output_dir = os.path.join(output_dir,alg_name,layout)

    check_dir(full_output_dir)

    if not os.path.exists(full_output_dir):
        os.makedirs(full_output_dir)

    # tracked over all episodes for plots
    all_rewards = [] 
    
    
    model_update_frequency = 5
    output_frequency = 100

    # reset episode stats
    recent_episodes = []
    recent_a0_rewards = []
    recent_a1_rewards = []

    for episode in tqdm(range(num_episodes), desc="Training Progress", ascii=True):

        # Episode termination flag
        terminated = False

        # tracked per episode for recent_episode stats
        episode_reward = 0
        episode_a0 = 0
        episode_a1 = 0


        state = env.reset()
        print(type(state))
        
        # start with turn_index = 0
        turn_idx = 0
   
        while not terminated:
            
            indexed_state = state
            action = agent.findAction(torch.tensor(state).to(agent.device))
            
            
            
            
            new_state, reward, terminated, info = env.step(actions)
            
            a0_state = agent0.idx.concat(new_state)
            a1_state = agent1.idx.concat(new_state)
            
           


            numpy_new_obs=np.array(new_obs)

            # agent 0 torch obs
            a0_t_new_obs = torch.tensor(numpy_new_obs[agent0.get_agent_index()], dtype=torch.float32).to(agent0.device).detach()
            a0_t_old_obs = torch.tensor(numpy_obs[agent0.get_agent_index()], dtype=torch.float32).to(agent0.device).detach()


            # agent 1 torch obs
            a1_t_new_obs = torch.tensor(numpy_new_obs[agent1.get_agent_index()], dtype=torch.float32).to(agent1.device).detach()
            a1_t_old_obs = torch.tensor(numpy_obs[agent1.get_agent_index()], dtype=torch.float32).to(agent1.device).detach()
            

            # could make changes to how reward is used here (sharing rewards etc)
            agent0.replay_buffer.push(a0_t_old_obs, action0, reward + rew0, a0_t_new_obs, terminated)
            agent1.replay_buffer.push(a1_t_old_obs, action1, reward + rew1,a1_t_new_obs, terminated)

            if episode % model_update_frequency == 0 and episode != 0:
                [agent.update_model() for agent in agents]

            numpy_obs = numpy_new_obs

        all_rewards.append(episode_reward)
 

        recent_episodes.append(episode)
        recent_a1_rewards.append(episode_a1)
        recent_a0_rewards.append(episode_a0)
    

        for agent in agents:
            if episode % agent.target_update_freq == 0:
                agent.target_model.load_state_dict(agent.model.state_dict())
            
        if episode % output_frequency == 0 and episode != 0:
            folder_name = f"{full_output_dir}/episode_{episode}"
            # Check if the directory exists, and if not, create it
            check_dir(folder_name)
            for agent in agents:
                agent.save_model_weights(folder_name,agent.idx)
                if agent.idx == 0:
                    print(f"epsilon: {agent.epsilon}")
            
    
            # save rewards info
            rewards_plot_path = folder_name + '/rolling_average.png'
            save_episode_data(recent_episodes, recent_a0_rewards, recent_a1_rewards, recent_combined_rewards, recent_soups, folder_name)
      

            # plots
            plot_training_rewards(plot_path=rewards_plot_path,rewards=all_rewards,rolling_window=output_frequency)

            # reset episode stats
            recent_episodes = []
            recent_a1_rewards = []
            recent_a0_rewards = []
          