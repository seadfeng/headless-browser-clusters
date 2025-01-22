FROM node:18-slim

WORKDIR /app

COPY package*.json ./

COPY ./dist ./dist

RUN npm install

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"] 