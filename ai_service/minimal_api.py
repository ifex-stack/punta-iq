"""
Minimal Flask API for PuntaIQ AI microservice.
This provides the essential API endpoints required for integration with the main server.
"""
import os
import logging
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Use port 5001 to avoid conflict with Node.js server on port 5000
PORT = int(os.getenv("PORT", 5001))

# API endpoints
@app.route('/api/status', methods=['GET'])
def status():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "message": "The AI sports prediction service is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/detailed-status', methods=['GET'])
def detailed_status():
    """Detailed service status endpoint."""
    return jsonify({
        "overall": "ok",
        "services": {
            "api-football": {"status": "ok", "last_check": datetime.now().isoformat()},
            "odds-api": {"status": "ok", "last_check": datetime.now().isoformat()},
            "thesportsdb": {"status": "ok", "last_check": datetime.now().isoformat()},
            "balldontlie": {"status": "ok", "last_check": datetime.now().isoformat()}
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/sports', methods=['GET'])
def supported_sports():
    """Get list of supported sports."""
    return jsonify({
        "sports": [
            {"id": "soccer", "name": "Soccer", "icon": "soccer-ball", "enabled": True},
            {"id": "basketball", "name": "Basketball", "icon": "basketball", "enabled": True},
            {"id": "baseball", "name": "Baseball", "icon": "baseball", "enabled": True},
            {"id": "american_football", "name": "American Football", "icon": "football", "enabled": True},
            {"id": "hockey", "name": "Hockey", "icon": "hockey-puck", "enabled": True}
        ]
    })

@app.route('/api/predictions/sports/<sport>', methods=['GET'])
def sport_predictions(sport):
    """Get predictions for a specific sport."""
    # Simulate different predictions based on the sport
    tomorrow = datetime.now() + timedelta(days=1)
    
    predictions = {
        "sport": sport,
        "predictions": []
    }
    
    if sport == "soccer":
        predictions["predictions"] = [
            {
                "id": "s1",
                "matchId": "m1",
                "sport": "soccer",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": "Manchester United",
                "awayTeam": "Arsenal",
                "startTime": tomorrow.isoformat(),
                "league": "Premier League",
                "predictedOutcome": "home",
                "confidence": 0.78,
                "confidenceLevel": "high",
                "tier": "basic",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.78,
                    "draw": 0.15,
                    "away_win": 0.07
                }
            },
            {
                "id": "s2",
                "matchId": "m2",
                "sport": "soccer",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": "Barcelona",
                "awayTeam": "Real Madrid",
                "startTime": tomorrow.isoformat(),
                "league": "La Liga",
                "predictedOutcome": "draw",
                "confidence": 0.51,
                "confidenceLevel": "medium",
                "tier": "pro",
                "isPremium": True,
                "predictions": {
                    "home_win": 0.31,
                    "draw": 0.51,
                    "away_win": 0.18
                }
            }
        ]
    elif sport == "basketball":
        predictions["predictions"] = [
            {
                "id": "b1",
                "matchId": "m3",
                "sport": "basketball",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": "LA Lakers",
                "awayTeam": "Chicago Bulls",
                "startTime": tomorrow.isoformat(),
                "league": "NBA",
                "predictedOutcome": "home",
                "confidence": 0.83,
                "confidenceLevel": "high",
                "tier": "basic",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.83,
                    "away_win": 0.17
                }
            }
        ]
    else:
        # For other sports, provide generic predictions
        predictions["predictions"] = [
            {
                "id": f"{sport[0]}1",
                "matchId": f"m{sport[0]}1",
                "sport": sport,
                "createdAt": datetime.now().isoformat(),
                "homeTeam": "Team A",
                "awayTeam": "Team B",
                "startTime": tomorrow.isoformat(),
                "league": f"{sport.capitalize()} League",
                "predictedOutcome": "home",
                "confidence": 0.65,
                "confidenceLevel": "medium",
                "tier": "basic",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.65,
                    "away_win": 0.35
                }
            }
        ]
    
    return jsonify(predictions)

@app.route('/api/predictions/accumulators', methods=['GET'])
def accumulators():
    """Get accumulator predictions."""
    tomorrow = datetime.now() + timedelta(days=1)
    
    return jsonify({
        "accumulators": [
            {
                "id": "acc1",
                "name": "Weekend Special",
                "tier": "basic",
                "isPremium": False,
                "totalOdds": 5.25,
                "confidence": 0.62,
                "createdAt": datetime.now().isoformat(),
                "predictions": [
                    {
                        "id": "s1",
                        "matchId": "m1",
                        "sport": "soccer",
                        "homeTeam": "Manchester United",
                        "awayTeam": "Arsenal",
                        "startTime": tomorrow.isoformat(),
                        "league": "Premier League",
                        "predictedOutcome": "home",
                        "odds": 1.75
                    },
                    {
                        "id": "b1",
                        "matchId": "m3",
                        "sport": "basketball",
                        "homeTeam": "LA Lakers",
                        "awayTeam": "Chicago Bulls",
                        "startTime": tomorrow.isoformat(),
                        "league": "NBA",
                        "predictedOutcome": "home",
                        "odds": 1.50
                    },
                    {
                        "id": "h1",
                        "matchId": "m5",
                        "sport": "hockey",
                        "homeTeam": "Toronto Maple Leafs",
                        "awayTeam": "Boston Bruins",
                        "startTime": tomorrow.isoformat(),
                        "league": "NHL",
                        "predictedOutcome": "away",
                        "odds": 2.00
                    }
                ]
            },
            {
                "id": "acc2",
                "name": "Premium Combo",
                "tier": "elite",
                "isPremium": True,
                "totalOdds": 8.70,
                "confidence": 0.72,
                "createdAt": datetime.now().isoformat(),
                "predictions": [
                    {
                        "id": "s2",
                        "matchId": "m2",
                        "sport": "soccer",
                        "homeTeam": "Barcelona",
                        "awayTeam": "Real Madrid",
                        "startTime": tomorrow.isoformat(),
                        "league": "La Liga",
                        "predictedOutcome": "draw",
                        "odds": 3.50
                    },
                    {
                        "id": "f1",
                        "matchId": "m6",
                        "sport": "american_football",
                        "homeTeam": "Kansas City Chiefs",
                        "awayTeam": "San Francisco 49ers",
                        "startTime": tomorrow.isoformat(),
                        "league": "NFL",
                        "predictedOutcome": "home",
                        "odds": 1.65
                    },
                    {
                        "id": "bb1",
                        "matchId": "m7",
                        "sport": "baseball",
                        "homeTeam": "New York Yankees",
                        "awayTeam": "Boston Red Sox",
                        "startTime": tomorrow.isoformat(),
                        "league": "MLB",
                        "predictedOutcome": "away",
                        "odds": 1.50
                    }
                ]
            }
        ]
    })

# Start server
if __name__ == '__main__':
    logger.info(f"Starting minimal PuntaIQ AI microservice on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)