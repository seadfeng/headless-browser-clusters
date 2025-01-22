#!/bin/bash

## locale build

# seadfeng/playwright-browser-app

VERSION=$(node -p "require('./package.json').version")
APP=$(node -p "require('./package.json').name")

echo "Build: ${APP}.${VERSION}" 

docker buildx build \
  --no-cache  \
  --build-arg VERSION=$VERSION \
  -t seadfeng/playwright-${APP}:$VERSION \
  -t seadfeng/playwright-${APP}:latest \
  -f ./Dockerfile \
  .

echo "seadfeng/${APP}:${VERSION}" 
echo "seadfeng/${APP}:latest"