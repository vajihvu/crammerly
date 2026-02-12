# Stage 1: Frontend Build
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files first for caching
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy backend package files and install production dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --production

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000
CMD ["node", "backend/index.js"]
