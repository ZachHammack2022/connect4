# Start from the Node base image
FROM node:18

# Set the working directory in the container
WORKDIR /app/frontend

# Copy package.json and package-lock.json and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the frontend source code
COPY frontend/ .

# CRA bakes REACT_APP_* variables in at build time
ARG REACT_APP_API_BASE_URL=http://localhost:8000
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Build the application
RUN npm run build

# Install serve to serve the build folder
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
