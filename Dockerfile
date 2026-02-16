# Stage 1: Dependency Resolver
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files for workspace
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
# This creates a lean node_modules for the final image
RUN npm ci --workspace=backend --omit=dev --ignore-scripts

# Stage 2: Runtime Environment
FROM node:22-alpine AS runner
WORKDIR /app

# Create a system user for the application
RUN addgroup -S app && adduser -S app -G app

# Set production environment
ENV NODE_ENV=production

# Copy source code
COPY --chown=app:app backend/ ./backend/

# Copy dependencies from deps stage
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --from=deps --chown=app:app /app/backend/node_modules ./backend/node_modules

# Copy package manifest
COPY --from=deps --chown=app:app /app/package.json ./package.json

# Switch to the non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:5000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Backend listens on 5000
EXPOSE 5000

# Start the API server
CMD ["node", "backend/index.js"]
