#!/bin/bash

echo "Starting PuntaIQ AI Microservice..."

# Change directory to the AI service folder
cd ai_service

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed"
    exit 1
fi

# Set environment variables if not already set
if [ -z "$ODDS_API_KEY" ]; then
    # Use environment variables from .env file
    if [ -f "../.env" ]; then
        source "../.env"
    fi
fi

# Start the API service in the background
echo "Running AI service with API_SPORTS_KEY and ODDS_API_KEY"
python api_service.py &

# Save the process ID
PID=$!
echo "AI service started with PID: $PID"
echo $PID > ".ai_service.pid"

echo "AI service is now running in the background on port 5000"
echo "To stop it later, run: kill $(cat .ai_service.pid)"