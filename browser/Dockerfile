FROM mcr.microsoft.com/playwright:v1.49.1-jammy
WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN npx playwright install-deps chromium

COPY . .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]