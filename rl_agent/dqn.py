import torch
import re
from torch import nn
from torch import optim
import gymnasium as gym
import numpy as np
# import imageio
from tqdm import tqdm
import os
import matplotlib.pyplot as plt
from collections import  deque, namedtuple
import random
import json
import torch
import torch.nn.functional as F


device = (
    "cuda"
    if torch.cuda.is_available()
    else "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)

print(f"Using {device} device")

class DQN(nn.Module):
    def __init__(self):
        super(DQN, self).__init__()
        # Fully connected layers
        self.fc1 = nn.Linear(6 * 7 + 1, 128)  # Flatten the 6x7 grid + agent index
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 7)  # 7 actions for the output layer

    def forward(self, x):
        # Ensure input tensor is properly shaped
        x = x.view(x.size(0), -1)
        # Forward pass through the network
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x


model = DQN().to(device)



# Define the Experience named tuple
Experience = namedtuple('Experience', ('state', 'action', 'reward', 'next_state', 'done'))

class ReplayBuffer:
    def __init__(self, capacity, device):
        self.memory = deque(maxlen=capacity)
        self.device = device
    
    def push(self, state, action, reward, next_state, done):
        
    
        # Convert action, reward, and done to tensors if they are not already, directly on the device
        state = torch.tensor([state], dtype=torch.int64, device=self.device) if not isinstance(state, torch.Tensor) else state.to(self.device)
        action = torch.tensor([action], dtype=torch.int64, device=self.device) if not isinstance(action, torch.Tensor) else action.to(self.device)
        reward = torch.tensor([reward], dtype=torch.float, device=self.device) if not isinstance(reward, torch.Tensor) else reward.to(self.device)
        next_state = torch.tensor([next_state], dtype=torch.int64, device=self.device) if not isinstance(next_state, torch.Tensor) else next_state.to(self.device)
        done = torch.tensor([done], dtype=torch.float, device=self.device) if not isinstance(done, torch.Tensor) else done.to(self.device)

        # Create an experience tuple and append it to the memory
        e = Experience(state, action, reward, next_state, done)
        self.memory.append(e)


    def sample(self, batch_size):
        experiences = random.sample(self.memory, min(batch_size, len(self.memory)))
        
        # Use zip(*) to unzip the experiences into separate lists
        states, actions, rewards, next_states, dones = map(torch.stack, zip(*experiences))

        # Ensure all tensors are on the correct device and return as a tuple
        return tuple(item.to(self.device) for item in (states, actions, rewards, next_states, dones))

class QLearningAgent(object):
    def __init__(self,lr,batch_size,buffer_size):

        self.name = "dqn"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.gamma = 0.99
        self.num_actions = 6
        self.model = self.create_model().to(self.device)
        self.target_model = DQN().to(self.device)
        self.target_model.load_state_dict(self.model.state_dict())
        self.target_model.eval() 
        self.target_update_freq = 20
        self.buffer_size = buffer_size
        self.replay_buffer = ReplayBuffer(capacity=buffer_size,device = self.device)
        self.loss_fn = torch.nn.MSELoss() 
        self.lr = lr
        self.optimizer = optim.Adam(self.model.parameters(), lr=lr)
        self.batch_size = batch_size
        self.epsilon_start = 1.0
        self.epsilon_final = 0.01
        self.epsilon_decay = 0.99999  # or any other factor
        self.epsilon=self.epsilon_start
    
    

    def find_greedy_action(self, agent_idx, state) -> int:
        self.model.eval()  # Set the model to evaluation mode

        # Flatten the 2D state array and convert it to a tensor
        state_tensor = torch.tensor(state, dtype=torch.float32).flatten()

        # Convert agent_idx to a tensor and append it to the state tensor
        agent_idx_tensor = torch.tensor([agent_idx], dtype=torch.float32)
        combined_state = torch.cat((state_tensor, agent_idx_tensor), 0)

        # Pass the combined state tensor to the model and find the action
        action = torch.argmax(self.model(combined_state.unsqueeze(0))).item()

        self.model.train()
        return int(action)

    
    def find_action(self, turn_idx,state) -> int:
        if (np.random.uniform(0,1) < self.epsilon):
            action = np.random.randint(self.num_actions)
        else: 
            action = self.find_greedy_action(turn_idx,state)
    
        return action
    
    def update_model(self):
        self.epsilon = max(self.epsilon_final,self.epsilon_decay*self.epsilon)
        if len(self.replay_buffer.memory) < self.batch_size:
            return
        self.optimizer.zero_grad()
        
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)
        
        rewards = rewards.squeeze()  # Reshape from [32, 1] to [32]
        dones = dones.squeeze()  # Reshape from [32, 1] to [32]
    
        

        q_values = self.model(states)
        # print(q_values)
        
        
     
        taken_q_values = q_values.gather(1, actions).squeeze(-1)
        
        doness = dones 
        next_q_values = torch.max(self.target_model(next_states), dim=1).values
        # print(f"next_q_values shape: {next_q_values.shape}")

        true_values = rewards + self.gamma * next_q_values * (1 - doness)
        
        # Add a line to print shapes for debugging
        # print(f"Shapes - taken_q_values: {taken_q_values.shape}, true_values: {true_values.shape}")
        loss = self.loss_fn(taken_q_values, true_values)
        
        loss.backward()
        self.optimizer.step()
                        
    def create_model(self):
        model = DQN()
        return model
    
    
    def save_model_weights(self, folder_name, path='model_weights.pth'):
        if not os.path.exists(folder_name):
            os.makedirs(folder_name)
        save_path = os.path.join(folder_name,f"{path}")
        torch.save(self.model.state_dict(), save_path)

    def load_model_weights(self, path):
        model_weights = torch.load(path)
        self.model.load_state_dict(model_weights)
        self.model.eval()