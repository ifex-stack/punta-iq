"""
Simple Flask server for the AI Sports Prediction API
Runs on port 5001 and provides basic endpoints for the main application
"""
import os
import sys
import json
import time
import datetime
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('puntaiq_ai_service')

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Get port from environment variable or use 5001 as default
PORT = int(os.environ.get('PORT', 5001))

# In-memory storage for predictions
predictions = {}
sports_data = {
    "sports": [
        {
            "key": "soccer",
            "name": "Soccer",
            "available_leagues": ["EPL", "La Liga", "Serie A", "Bundesliga", "Ligue 1"],
            "prediction_types": ["match_outcome", "goals_over_under", "both_teams_to_score"],
            "active": True
        },
        {
            "key": "basketball",
            "name": "Basketball",
            "available_leagues": ["NBA", "EuroLeague", "NCAA"],
            "prediction_types": ["match_outcome", "points_over_under", "spread"],
            "active": True
        },
        {
            "key": "baseball",
            "name": "Baseball",
            "available_leagues": ["MLB", "NPB"],
            "prediction_types": ["match_outcome", "runs_over_under"],
            "active": True
        },
        {
            "key": "american_football",
            "name": "American Football",
            "available_leagues": ["NFL", "NCAA"],
            "prediction_types": ["match_outcome", "points_over_under", "spread"],
            "active": True
        }
    ]
}

@app.route('/api/status', methods=['GET'])
def status():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "message": "The AI sports prediction service is running",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/detailed-status', methods=['GET'])
def detailed_status():
    """Detailed service status endpoint."""
    return jsonify({
        "overall": "ok",
        "services": {
            "odds_api": {
                "status": "ok",
                "message": "The Odds API is operational",
                "requests_remaining": "95"
            },
            "sportsdb_api": {
                "status": "ok",
                "message": "TheSportsDB API is operational"
            }
        },
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/sports', methods=['GET'])
def get_sports():
    """Get list of supported sports and their configurations."""
    return jsonify(sports_data)

@app.route('/api/predictions/generate', methods=['POST'])
def generate_predictions():
    """
    Generate predictions for upcoming matches.
    
    Request body:
    {
        "days_ahead": 3,
        "sports": ["soccer", "basketball"],
        "store_results": true
    }
    """
    request_data = request.get_json() or {}
    days_ahead = request_data.get('days_ahead', 3)
    sports = request_data.get('sports', ['soccer', 'basketball'])
    
    # Simulate prediction generation
    time.sleep(1)  # Simulate processing time
    
    result = {
        "status": "success",
        "message": f"Generated predictions for {len(sports)} sports, looking {days_ahead} days ahead",
        "predictions": {
            "count": 24,
            "sports": sports
        }
    }
    
    return jsonify(result)

@app.route('/api/predictions/sports/<sport>', methods=['GET'])
def get_sport_predictions(sport):
    """Get predictions for a specific sport."""
    # Get tier and confidence filters from query params
    tier = request.args.get('tier', 'all')
    confidence = request.args.get('confidence', 'all')
    
    # Generate mock predictions based on the sport
    sport_predictions = generate_mock_predictions(sport, tier, confidence)
    
    return jsonify(sport_predictions)

@app.route('/api/predictions/accumulators', methods=['GET'])
def get_accumulators():
    """Get accumulator predictions."""
    tier = request.args.get('tier', 'all')
    
    accumulators = {
        "status": "success",
        "timestamp": datetime.datetime.now().isoformat(),
        "accumulators": [
            {
                "id": "acc123",
                "name": "Weekend Winners",
                "description": "Top picks for the weekend's biggest matches",
                "sport": "soccer",
                "tier": "free",
                "predictions": [
                    {"match_id": "m123", "home_team": "Arsenal", "away_team": "Chelsea", "prediction": "home_win", "confidence": 0.82},
                    {"match_id": "m124", "home_team": "Liverpool", "away_team": "Everton", "prediction": "home_win", "confidence": 0.78}
                ],
                "overall_confidence": 0.80,
                "potential_return": 3.45
            },
            {
                "id": "acc124",
                "name": "NBA Special",
                "description": "Selected NBA picks with strong historical backing",
                "sport": "basketball",
                "tier": "premium",
                "predictions": [
                    {"match_id": "m125", "home_team": "Lakers", "away_team": "Warriors", "prediction": "away_win", "confidence": 0.76},
                    {"match_id": "m126", "home_team": "Celtics", "away_team": "Knicks", "prediction": "home_win", "confidence": 0.82}
                ],
                "overall_confidence": 0.79,
                "potential_return": 3.92
            }
        ]
    }
    
    # Filter by tier if specified
    if tier != 'all':
        accumulators['accumulators'] = [acc for acc in accumulators['accumulators'] if acc['tier'] == tier]
    
    return jsonify(accumulators)

def generate_mock_predictions(sport, tier='all', confidence='all'):
    """Generate mock predictions for demo purposes."""
    current_time = datetime.datetime.now()
    
    if sport == 'soccer':
        predictions = [
            {
                "id": "p123",
                "matchId": "m123",
                "sport": "soccer",
                "createdAt": (current_time - datetime.timedelta(hours=6)).isoformat(),
                "homeTeam": "Arsenal",
                "awayTeam": "Chelsea",
                "startTime": (current_time + datetime.timedelta(days=1)).isoformat(),
                "league": "EPL",
                "predictedOutcome": "home_win",
                "confidence": 0.82,
                "confidenceLevel": "high",
                "tier": "free",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.82,
                    "draw": 0.12,
                    "away_win": 0.06
                }
            },
            {
                "id": "p124",
                "matchId": "m124",
                "sport": "soccer",
                "createdAt": (current_time - datetime.timedelta(hours=6)).isoformat(),
                "homeTeam": "Liverpool",
                "awayTeam": "Everton",
                "startTime": (current_time + datetime.timedelta(days=1)).isoformat(),
                "league": "EPL",
                "predictedOutcome": "home_win",
                "confidence": 0.78,
                "confidenceLevel": "medium",
                "tier": "free",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.78,
                    "draw": 0.15,
                    "away_win": 0.07
                }
            },
            {
                "id": "p125",
                "matchId": "m125",
                "sport": "soccer",
                "createdAt": (current_time - datetime.timedelta(hours=6)).isoformat(),
                "homeTeam": "Barcelona",
                "awayTeam": "Real Madrid",
                "startTime": (current_time + datetime.timedelta(days=2)).isoformat(),
                "league": "La Liga",
                "predictedOutcome": "draw",
                "confidence": 0.68,
                "confidenceLevel": "medium",
                "tier": "premium",
                "isPremium": True,
                "predictions": {
                    "home_win": 0.22,
                    "draw": 0.68,
                    "away_win": 0.10
                }
            }
        ]
    elif sport == 'basketball':
        predictions = [
            {
                "id": "p126",
                "matchId": "m126",
                "sport": "basketball",
                "createdAt": (current_time - datetime.timedelta(hours=4)).isoformat(),
                "homeTeam": "Lakers",
                "awayTeam": "Warriors",
                "startTime": (current_time + datetime.timedelta(days=1)).isoformat(),
                "league": "NBA",
                "predictedOutcome": "away_win",
                "confidence": 0.76,
                "confidenceLevel": "medium",
                "tier": "free",
                "isPremium": False,
                "predictions": {
                    "home_win": 0.24,
                    "away_win": 0.76
                }
            },
            {
                "id": "p127",
                "matchId": "m127",
                "sport": "basketball",
                "createdAt": (current_time - datetime.timedelta(hours=4)).isoformat(),
                "homeTeam": "Celtics",
                "awayTeam": "Knicks",
                "startTime": (current_time + datetime.timedelta(days=1)).isoformat(),
                "league": "NBA",
                "predictedOutcome": "home_win",
                "confidence": 0.82,
                "confidenceLevel": "high",
                "tier": "premium",
                "isPremium": True,
                "predictions": {
                    "home_win": 0.82,
                    "away_win": 0.18
                }
            }
        ]
    else:
        predictions = []
    
    # Filter by tier if specified
    if tier != 'all':
        predictions = [pred for pred in predictions if pred['tier'] == tier]
    
    # Filter by confidence if specified
    if confidence == 'high':
        predictions = [pred for pred in predictions if pred['confidenceLevel'] == 'high']
    elif confidence == 'medium':
        predictions = [pred for pred in predictions if pred['confidenceLevel'] == 'medium']
    
    return {
        "status": "success",
        "sport": sport,
        "count": len(predictions),
        "timestamp": current_time.isoformat(),
        "predictions": predictions
    }

if __name__ == '__main__':
    logger.info(f"Starting AI Sports Prediction API on port {PORT}")
    try:
        app.run(host='0.0.0.0', port=PORT, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)