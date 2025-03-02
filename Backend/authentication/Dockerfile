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

# Expose the authentication service port
EXPOSE 3002

# Start the authentication service
CMD ["npm", "start"]
