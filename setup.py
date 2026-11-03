from setuptools import setup, find_packages

setup(
    name='connect4_project',
    version='0.1',
    packages=find_packages(),
    # Everything the web backend needs.
    install_requires=[
        'fastapi==0.105.0',
        'uvicorn==0.25.0',
        'databases==0.8.0',
        'asyncpg==0.29.0',
        'gymnasium==0.29.1',
    ],
    extras_require={
        # Training the RL agents in rl_agent/: pip install -e ".[rl]"
        'rl': [
            'stable-baselines3==2.2.1',
            'torch==2.1.2',
            'matplotlib==3.8.2',
            'pandas==2.1.4',
            'tqdm==4.66.1',
        ],
        # httpx 0.28 removed an argument the pinned Starlette's TestClient uses.
        'dev': ['httpx<0.28'],
    },
)
