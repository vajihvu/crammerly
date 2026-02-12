# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built assets from builder
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/package*.json ./backend/

# Install only production dependencies for backend
RUN npm ci --omit=dev --workspace=backend

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["node", "backend/index.js"]
