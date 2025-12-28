# Multi-stage build for Gateway service
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 1: Development dependencies
FROM base AS deps
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Stage 2: Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/gateway/ ./apps/gateway/
COPY libs/ ./libs/
COPY nest-cli.json tsconfig*.json ./

# Build the application
RUN npm run build gateway

# Stage 3: Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application - fix path for nested structure
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/gateway/apps/gateway/src/main.js"]
