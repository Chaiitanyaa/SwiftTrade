# Use Node.js as the base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies first
COPY package*.json ./

# Install dependencies without bcrypt
RUN npm install --omit=dev

# Copy everything from `server/` into the container
COPY . .

# Rebuild bcrypt inside the container
RUN npm rebuild bcrypt --build-from-source

# Change working directory to `src/`
WORKDIR /app/src

# Expose the application port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
