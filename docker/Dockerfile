# Start from a Python base image
FROM python:3.10

# Set a working directory for the backend
WORKDIR /connect4/backend

# Install Python dependencies
# It's usually a good idea to copy the requirements file and install dependencies first
# This allows Docker's caching mechanism to work better
COPY setup.py .
RUN pip install -e .

# Copy the back-end code
COPY ./server/ .



# Set a working directory for the frontend
WORKDIR /connect4/frontend

# Copy the front-end build
COPY ./frontend/build .

# Expose the port the connect4 runs on
EXPOSE 8000

WORKDIR /connect4/game
COPY ./game .

WORKDIR /connect4/rl_agent
COPY ./rl_agent .

# Set the working directory back to the backend directory
WORKDIR /connect4/backend

# Command to run the connect4
# Ensure that 'run-server.sh' is executable and has the correct shebang (e.g., #!/bin/bash)
CMD ["bash","run-server.sh"]
