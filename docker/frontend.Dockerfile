# Start from the Node base image
FROM node:16

# Set the working directory in the container
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

#idk why
RUN npm install axios 

# Copy the frontend source code
COPY frontend/ .

# Build the application
RUN npm run build

# Install serve to serve the build folder
RUN npm install -g serve

# Command to run the app
# CMD ["serve", "-s", "build", "-l", "3000"]
