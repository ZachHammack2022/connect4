# Start from a Python base image
FROM python:3.10

# Set the working directory in the container
WORKDIR /app/

# Copy the dependencies file to the working directory
COPY requirements.txt .
COPY setup.py .

# Install any dependencies
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -e .

WORKDIR /app/backend
# Copy the content of the local src directory to the working directory
COPY backend/ .

# Specify the command to run on container startup
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
