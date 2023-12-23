from setuptools import setup, find_packages

setup(
    name='connect4_project',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        'fastapi==0.105.0',
        'gym==0.26.2',
        'pipdeptree==2.13.1',
        'Shimmy==1.3.0',
        'stable-baselines3==2.2.1',
        'uvicorn==0.25.0'
    ]
)

