# ================================
# Northern Harvest - Backend
# ================================
FROM node:20-alpine

WORKDIR /app

# Install curl for healthchecks and set production env
ENV NODE_ENV=production
RUN apk add --no-cache curl

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy application source
COPY . .

# Expose the backend port
EXPOSE 5001

# Health check (use lightweight /health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["node", "server.js"]
