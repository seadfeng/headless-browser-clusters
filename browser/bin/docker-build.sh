#!/bin/bash

# seadfeng/playwright-browser-worker

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

echo "seadfeng/playwright-${APP}:${VERSION}" 
echo "seadfeng/playwright-${APP}:latest"