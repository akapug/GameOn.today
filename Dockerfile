# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and additional packages
RUN npm ci
RUN npm install postgres

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only and additional packages
RUN npm ci --omit=dev
RUN npm install postgres

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/db ./db

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"] 