#!/bin/bash

# Make sure the proxy server is executable
chmod +x replit-proxy.js

# Kill any existing Node.js processes to avoid port conflicts
echo "Checking for existing Node.js processes..."
pkill -f "node" || echo "No existing Node.js processes found"

# Wait for any processes to fully terminate
sleep 2

# Start the proxy server that will make the port 5000 available for workflow
echo "Starting PuntaIQ with proxy bridge at port 5000..."
PORT=5000 node replit-proxy.js