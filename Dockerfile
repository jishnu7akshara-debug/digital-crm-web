# ==========================================
# Digital Footprint OS - Production Single Container
# Combines Next.js 15 Web App + Python FastAPI API
# ==========================================

# Stage 1: Build Next.js Web App
FROM node:20-alpine AS web-builder
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile=false

COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter digitalfootprint-web build

# Stage 2: Production Unified Runner (Python 3.12 + Node 20)
FROM python:3.12-slim AS runner
WORKDIR /app

# Install Node.js for Next.js runtime and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend
COPY apps/api ./apps/api

# Copy Next.js built frontend and dependencies
COPY --from=web-builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=web-builder /app/apps/web/package.json ./apps/web/
COPY --from=web-builder /app/apps/web/.next ./apps/web/.next
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=web-builder /app/node_modules ./node_modules
COPY --from=web-builder /app/apps/web/node_modules ./apps/web/node_modules

# Copy startup runner script
COPY scripts/start-single.sh /app/start-single.sh
RUN chmod +x /app/start-single.sh

ENV PORT=3000
ENV NODE_ENV=production
ENV APP_ENV=production

EXPOSE 3000

CMD ["/bin/bash", "/app/start-single.sh"]
