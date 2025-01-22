#!/usr/bin/env bash

# Pull the latest images
docker compose pull
 
docker compose up -d
 

# Clean up unused Docker resources
docker system prune -f