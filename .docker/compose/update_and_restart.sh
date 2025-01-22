#!/usr/bin/env bash

# Pull the latest images
docker compose pull
 
docker compose up -d --no-deps --build 
