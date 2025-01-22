FROM node:18-slim

WORKDIR /app 

COPY ./dist ./dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"] 