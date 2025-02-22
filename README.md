#  Headless Browser Clusters

## Local Development

```bash
# create .env
cp ./app/.env.example ./app/.env

# install chromium for test
npm run app:chromium:install

# start
npm run app:dev
```

### headless: false for Development

```bash
curl -X POST http://127.0.0.1:3000/api/v1/fetch-dev \
     -H "Content-Type: application/json" \
     -H "X-Api-key: your_api_key" \
     -d '{ 
           "url": "https://api.ipify.org/?format=jsonp"
         }'
```

## Local Build

```bash

# app
npm run app:build

# browser worker
npm run browser:build

```

## Docker Quick Start

```bash

npm run start

# or

cd .docker/compose && docker compose up -d
```


### curl test


```bash
curl -X POST http://127.0.0.1:3100/api/v1/fetch \
     -H "Content-Type: application/json" \
     -H "X-Api-key: your_api_key" \
     -d '{ 
           "url": "https://api.ipify.org/?format=jsonp"
         }'
```

curl with proxy

```bash
curl -X POST http://127.0.0.1:3100/api/v1/fetch \
     -H "Content-Type: application/json" \
     -H "X-Api-key: your_api_key" \
     -d '{ 
           "url": "https://api.ipify.org/?format=jsonp",
           "proxy": "http://user:pass@127.0.0.1:8080"
         }'
```


## Deploy

1. self host init

```bash
ssh root@host "mkdir -p /home/deploy/app/headless-browser-clusters"
rsync -avz .docker/compose/ root@host:/home/deploy/app/headless-browser-clusters
```

2. start

```bash
ssh root@host "cd /home/deploy/app/headless-browser-clusters && npm run start"
```




