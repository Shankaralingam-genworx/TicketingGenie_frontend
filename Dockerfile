# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build args — API URLs baked in at build time
ARG VITE_API_AUTH_URL=http://localhost:8001
ARG VITE_API_TICKET_URL=http://localhost:8002

ENV VITE_API_AUTH_URL=$VITE_API_AUTH_URL
ENV VITE_API_TICKET_URL=$VITE_API_TICKET_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built files from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]