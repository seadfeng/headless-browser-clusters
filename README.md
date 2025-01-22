#  Headless Browser Clusters

## Local Build

```bash

# express
pnpm express:build

# browser worker
pnpm browser:build

```

## Quick Start

```bash
docker compose up
```


### test data for post
 

```json
curl -X POST http://127.0.0.1:3010/api/v1/fetch \
     -H "Content-Type: application/json" \
     -H "X-Api-key: your_api_key" \
     -d '{ 
           "url": "https://api.ipify.org/?format=jsonp" 
         }'
```


## Deploy

1. self host init

```bash
ssh root@host "mkdir /home/deploy/app/headless-browser-clusters"
rsync -avz .docker/compose root@host:/home/deploy/app/headless-browser-clusters
```

2. start

```bash
ssh root@host "cd /home/deploy/app/headless-browser-clusters && pnpm start"
```




