FROM mcr.microsoft.com/playwright:v1.49.1-jammy
WORKDIR /app

COPY package*.json ./


RUN npm install

RUN npx playwright install-deps chromium

COPY . .

CMD ["node", "worker.js"]