# ================================
# Northern Harvest - Frontend (Production Web)
# Multi-stage build: Build with Node, serve with nginx
# ================================

# --- Stage 1: Build the Expo web bundle ---
FROM node:20-alpine AS builder

RUN apk add --no-cache git bash

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application source
COPY . .

# Backend URL injected at build time (baked into the JS bundle)
ARG EXPO_PUBLIC_API_URL=http://localhost:5001
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Build the production web bundle
RUN npx expo export --platform web

# --- Stage 2: Serve with nginx ---
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built web bundle from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
