from flask import Flask, jsonify
from flask_cors import CORS
import datetime
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "message": "The AI sports prediction service is running",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/sports', methods=['GET'])
def sports():
    return jsonify({
        "sports": [
            {"id": "soccer", "name": "Soccer", "icon": "soccer-ball", "enabled": True},
            {"id": "basketball", "name": "Basketball", "icon": "basketball", "enabled": True},
            {"id": "baseball", "name": "Baseball", "icon": "baseball", "enabled": True},
            {"id": "american_football", "name": "American Football", "icon": "football", "enabled": True},
            {"id": "hockey", "name": "Hockey", "icon": "hockey-puck", "enabled": True}
        ]
    })

@app.route('/api/predictions/sports/soccer', methods=['GET'])
def soccer_predictions():
    return jsonify({
        "status": "success",
        "sport": "soccer",
        "count": 2,
        "timestamp": datetime.datetime.now().isoformat(),
        "predictions": [
            {
                "id": "p123",
                "matchId": "m123",
                "sport": "soccer",
                "createdAt": datetime.datetime.now().isoformat(),
                "homeTeam": "Arsenal",
                "awayTeam": "Chelsea",
                "startTime": (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat(),
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
                "createdAt": datetime.datetime.now().isoformat(),
                "homeTeam": "Liverpool",
                "awayTeam": "Everton",
                "startTime": (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat(),
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
            }
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)