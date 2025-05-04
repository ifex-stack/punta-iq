#!/bin/bash

# Start PuntaIQ with both the main server and AI microservice
echo "Starting PuntaIQ Full Stack..."

# First, start the AI microservice in the background
echo "Starting AI microservice..."
cd ai_service
python api_service.py &
AI_PID=$!
cd ..

# Wait a moment for the AI service to initialize
echo "Waiting for AI service to initialize..."
sleep 2

# Start the main Node.js server (this will run in the foreground)
echo "Starting main Node.js server..."
npm run dev

# If the main server exits, also stop the AI microservice
kill $AI_PID