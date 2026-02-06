#!/bin/bash

# Navigate to the script's directory ensures we are in purchasing-app
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "Cleaning up old containers..."
docker-compose down

echo "Starting Purchasing App Services..."
docker-compose up --build
