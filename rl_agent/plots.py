import numpy as np
import matplotlib.pyplot as plt
def plot_training_lengths(plot_path,lengths, rolling_window=100):
        """Plot rewards and rolling average"""
        path = f"{plot_path}/lengths.png"
        plt.figure(figsize=(10,5))
        plt.plot(lengths, label='Episode Lengths')
        rolling_mean = np.convolve(lengths, np.ones(rolling_window)/rolling_window, mode='valid')
        plt.plot(range(rolling_window-1, len(lengths)), rolling_mean, label=f'Rolling Mean ({rolling_window} episodes)')
        plt.xlabel('Episode')
        plt.ylabel('Lengths')
        plt.title('Rolling Average of Lengths Obtained During Training')
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(path)
        plt.close()