FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN uname -m

COPY package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN ls -la
 
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd -r -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs express

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]