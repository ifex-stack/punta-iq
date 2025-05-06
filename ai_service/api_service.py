"""
Flask API service for PuntaIQ 
Provides sports data and odds integrations
"""

import os
import sys
import logging
from datetime import datetime, timedelta

# Flask imports
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import main app from main.py
from main import app as main_app

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def add_cors_headers(response):
    """Add CORS headers to response"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# Simple wrapper around the main app
app = main_app

# Apply CORS headers to all responses
app.after_request(add_cors_headers)

def main():
    """Run the API service"""
    from config import PORT, ENV
    
    # Run Flask app
    logger.info(f"Starting API service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=(ENV == 'development'))

if __name__ == "__main__":
    main()