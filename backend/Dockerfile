FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create directories
RUN mkdir -p uploads logs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S hireiq -u 1001 && \
    chown -R hireiq:nodejs /app

USER hireiq

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
