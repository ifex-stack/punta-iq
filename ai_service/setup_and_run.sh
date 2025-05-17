#!/bin/bash

# PuntaIQ AI Service Setup and Run Script
# This script sets up the environment and runs the AI service

echo "=== PuntaIQ AI Service Setup ==="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check for virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    
    if [ $? -ne 0 ]; then
        echo "Failed to create virtual environment. Make sure python3-venv is installed."
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Using example file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Copied .env.example to .env. Please edit .env to add your API keys."
    else
        echo "Error: .env.example not found. Please create a .env file with your configuration."
        exit 1
    fi
fi

# Check for Firebase service account key
if [ ! -f "serviceAccountKey.json" ] && ! grep -q "FIREBASE_CRED_JSON" .env; then
    echo "Warning: serviceAccountKey.json not found and FIREBASE_CRED_JSON not set in .env."
    echo "Firebase functionality will be limited."
    
    if [ -f "serviceAccountKey.json.example" ]; then
        echo "Found serviceAccountKey.json.example. You should create a real service account key."
    fi
fi

# Run the service
echo "Starting PuntaIQ AI Service..."
echo "Press Ctrl+C to stop the service."
python main.py

# Deactivate virtual environment when done
deactivate