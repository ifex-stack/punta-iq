#!/bin/bash

# PuntaIQ AI Service Dependencies Installer
# This script installs all required Python packages

echo "=== Installing PuntaIQ AI Service Dependencies ==="

# Detect if running in Replit environment
if [ -n "$REPL_ID" ] || [ -d "/home/runner" ]; then
    echo "Detected Replit environment"
    PYTHON_CMD="python"
    
    # Check if Python is available
    if ! command -v $PYTHON_CMD &> /dev/null; then
        echo "Error: Python not found. Make sure Python is installed in your Replit."
        exit 1
    fi
    
    echo "Installing dependencies using pip..."
    $PYTHON_CMD -m pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies. Please check requirements.txt and try again."
        exit 1
    fi
else
    # Not in Replit, use virtual environment approach
    echo "Standard environment detected, using virtual environment"
    PYTHON_CMD="python3"
    
    # Check if Python 3 is installed
    if ! command -v $PYTHON_CMD &> /dev/null; then
        echo "Error: Python 3 is required but not installed. Please install Python 3 first."
        exit 1
    fi
    
    # Check for virtual environment
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        $PYTHON_CMD -m venv venv
        
        if [ $? -ne 0 ]; then
            echo "Failed to create virtual environment. Make sure python3-venv is installed."
            echo "On Ubuntu/Debian: sudo apt install python3-venv"
            echo "On Fedora: sudo dnf install python3-virtualenv"
            exit 1
        fi
    fi
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies using pip..."
    pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies. Please check requirements.txt and try again."
        deactivate
        exit 1
    fi
    
    # Deactivate virtual environment
    deactivate
fi

echo "All dependencies installed successfully!"
echo "You can now run the service using:"
echo "  - ./setup_and_run.sh (recommended)"
echo "  - python main.py"