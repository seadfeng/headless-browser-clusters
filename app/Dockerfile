FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

RUN node -v

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN ls -la
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN ls -la
 
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"] 