# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-slim AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm install prisma --save-dev && \
    npx prisma generate

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate && \
    npm run build

# =============================================================================
# Stage 3: Production runner
# =============================================================================
FROM node:20-slim AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fintrack

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# Copy build output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown fintrack:nodejs /app/logs

USER fintrack

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => { if(r.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
