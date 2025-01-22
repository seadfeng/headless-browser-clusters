#  Headless Browser Clusters

## build

```bash

# express
pnpm express:build

# browser worker
pnpm browser:build

## 一起打包
pnpm build
```

## start
```bash
docker compose down
docker compose up
```

```json
{ 
  "url": "https://api.ipify.org/?format=jsonp" 
} 
```


## Deploy

1.初次安装

```bash
ssh root@host "mkdir /home/deploy/app/playwright"
rsync -avz .docker/compose root@host:/home/deploy/app/playwright
```

2.git发布版本


