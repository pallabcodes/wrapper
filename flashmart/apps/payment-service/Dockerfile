# Multi-stage build for Payment service
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

FROM base AS builder
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY apps/payment-service/ ./apps/payment-service/
COPY libs/ ./libs/
COPY nest-cli.json tsconfig*.json ./
RUN npm run build payment-service

FROM base AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
USER nestjs
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/payment-service/apps/payment-service/src/main.js"]
