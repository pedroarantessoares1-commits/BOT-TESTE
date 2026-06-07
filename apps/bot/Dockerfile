FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json ./
COPY ./apps/bot ./apps/bot

# Install dependencies
RUN npm install

# Copy source
COPY apps/bot ./apps/bot

# Generate prisma client
RUN cd apps/bot && npx prisma generate

# Build typescript
RUN cd apps/bot && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json ./
COPY apps/bot/package.json ./apps/bot/
RUN npm install --omit=dev

# Copy built artifacts
COPY --from=builder /app/apps/bot/dist ./apps/bot/dist
COPY --from=builder /app/apps/bot/prisma ./apps/bot/prisma
COPY --from=builder /app/apps/bot/node_modules/@prisma ./apps/bot/node_modules/@prisma

WORKDIR /app/apps/bot

CMD ["npm", "run", "start"]
