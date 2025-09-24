# Multi-stage Dockerfile for NestJS Application
# Stage 1: Build dependencies and application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Install NestJS CLI globally for development
RUN npm install -g @nestjs/cli

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size (skip for development)
# RUN npm prune --production

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/main.js --health-check || exit 1

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]