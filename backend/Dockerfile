# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate && \
    npm run build

# =============================================================================
# Stage 3: Production runner
# =============================================================================
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fintrack

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

RUN mkdir -p /app/logs && chown fintrack:nodejs /app/logs

USER fintrack

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/server.js"]
