# ================================
# Northern Harvest - Frontend (Expo Dev Server)
# ================================
FROM node:20-alpine

# Install git (needed by some expo packages)
RUN apk add --no-cache git bash

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Expo dev server port
EXPOSE 8081
# Expo debugger
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set Expo to non-interactive mode
ENV CI=1
ENV EXPO_NO_DOTENV=1

CMD ["npx", "expo", "start", "--tunnel"]
