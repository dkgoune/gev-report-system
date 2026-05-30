# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
