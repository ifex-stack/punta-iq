#!/bin/bash

# Install required packages if not already installed
pip install flask requests pandas numpy scikit-learn xgboost python-dotenv firebase-admin

# Start the Flask API server
echo "Starting AI Prediction API server..."
python api.py