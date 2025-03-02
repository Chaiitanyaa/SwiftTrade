# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for efficient caching
COPY package.json ./

# Install dependencies
RUN npm install && npm list uuid || npm install uuid

# Copy all files into the container
COPY . .

# Expose the engine service port
EXPOSE 3006

# Start the engine service
CMD ["npm", "start"]
