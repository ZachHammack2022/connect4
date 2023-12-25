import os
import re
import json
import shutil


def check_dir(folder_name):
    # Check if the directory exists
    if os.path.exists(folder_name):
        # Clear existing contents of the directory
        for filename in os.listdir(folder_name):
            file_path = os.path.join(folder_name, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        # Create the directory if it does not exist
        os.makedirs(folder_name)



def save_episode_data(episodes, a0_rewards, a1_rewards, combined_rewards, soups_made, folder_name):
    rewards_file_path = os.path.join(folder_name, 'rewards.txt')
    with open(rewards_file_path, 'w') as f:
        for episode, a0, a1, total, soups in zip(episodes, a0_rewards, a1_rewards, combined_rewards, soups_made):
            f.write(f"Episode {episode}: Agent0 Reward = {a0}, Agent1 Reward = {a1}, Soups Made = {soups}, Total Combined Reward = {total}\n")
            
def load_rewards(output):
    rewards_file_path = os.path.join(output, 'rewards.json')
    if not os.path.exists(rewards_file_path):
        print(f"File {rewards_file_path} not found!")
        return []
    
    with open(rewards_file_path, 'r') as f:
        rewards = json.load(f)
    
    return rewards

def save_rewards(rewards,output_folder):
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        rewards_file_path = os.path.join(output_folder, 'rewards.json')
        with open(rewards_file_path, 'w') as f:
            json.dump(rewards, f)

def gather_rewards(main_dir='output'):
        # Dictionary to store episode number and its corresponding average reward
        rewards_dict = {}

        for dir_name in os.listdir(main_dir):
            dir_path = os.path.join(main_dir, dir_name)
            
            # Check if it's a directory and it matches the expected naming pattern
            if os.path.isdir(dir_path) and "episode_" in dir_name:
                # Extract the episode number using regex
                match = re.search(r"episode_(\d+)", dir_name)
                if match:
                    episode_number = int(match.group(1))
                    
                    # Check if rewards.txt exists in this subdirectory
                    rewards_file_path = os.path.join(dir_path, "rewards.txt")
                    if os.path.exists(rewards_file_path):
                        with open(rewards_file_path, 'r') as f:
                            lines = f.readlines()
                            # Extract the average reward 
                            reward_match = re.search(r"Average reward: ([\d.-]+)", lines[-1])
                            if reward_match:
                                average_reward = float(reward_match.group(1))
                                rewards_dict[episode_number] = average_reward

        # Check if summary.txt exists and delete it
        summary_path = os.path.join(main_dir, "summary.txt")
        if os.path.exists(summary_path):
            os.remove(summary_path)

        # Writing the rewards dictionary to summary.txt
        with open(summary_path, 'w') as f:
            for episode, reward in sorted(rewards_dict.items()):
                f.write(f"Episode {episode}: Average Reward = {reward}\n")

                
        return rewards_dict
       