"""
Simple API server for testing the AI Sports Prediction service.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import json
import os
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define basic routes
@app.route('/status', methods=['GET'])
def status():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "message": "The AI sports prediction service is running",
        "timestamp": datetime.now().isoformat(),
        "api_keys": {
            "football": bool(os.environ.get('API_FOOTBALL_KEY')),
            "sportsdb": True,  # Free tier always available
            "basketball": bool(os.environ.get('BALLDONTLIE_API_KEY'))
        },
        "firebase": bool(os.environ.get('FIREBASE_DB_URL') and os.environ.get('FIREBASE_CRED_JSON'))
    })

@app.route('/api/sports', methods=['GET'])
def get_sports():
    """Get list of supported sports."""
    sports = [
        {
            "id": "football",
            "name": "Football (Soccer)",
            "supported": bool(os.environ.get('API_FOOTBALL_KEY')),
            "icon": "football"
        },
        {
            "id": "basketball",
            "name": "Basketball",
            "supported": True,  # BallDontLie API has free tier
            "icon": "basketball"
        }
    ]
    
    return jsonify({
        "data": sports,
        "count": len(sports),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/test-credentials', methods=['GET'])
def test_credentials():
    """Test that API credentials are correctly configured."""
    credentials = {
        "api_football": {
            "configured": bool(os.environ.get('API_FOOTBALL_KEY')),
            "key": os.environ.get('API_FOOTBALL_KEY', '')[:5] + "..." if os.environ.get('API_FOOTBALL_KEY') else None
        },
        "firebase": {
            "db_url": {
                "configured": bool(os.environ.get('FIREBASE_DB_URL')),
                "url": os.environ.get('FIREBASE_DB_URL', '')[:10] + "..." if os.environ.get('FIREBASE_DB_URL') else None
            },
            "credentials": {
                "configured": bool(os.environ.get('FIREBASE_CRED_JSON')),
                "type": "JSON in environment variable"
            }
        }
    }
    
    return jsonify({
        "credentials": credentials,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)