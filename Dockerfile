# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]