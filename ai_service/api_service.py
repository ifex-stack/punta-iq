"""
Flask API service for PuntaIQ 
Provides sports data and odds integrations
"""

from flask import Flask, jsonify, request
import requests
import os
import json
import time
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure API keys
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
SPORTS_DB_API_KEY = os.getenv('SPORTSDB_API_KEY')

# Fallback keys for local development (not to be used in production)
ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"
SPORTSDB_API_BASE_URL = "https://www.thesportsdb.com/api/v1/json"

# Track API health and rate limits
api_status = {
    "odds_api": {
        "status": "unknown",
        "message": "Not checked yet",
        "requests_remaining": None,
        "last_checked": None
    },
    "sportsdb_api": {
        "status": "unknown",
        "message": "Not checked yet",
        "last_checked": None
    }
}

# CORS headers
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# API Status endpoint
@app.route('/api/status', methods=['GET'])
def get_status():
    # Update statuses if they're stale
    current_time = datetime.now()
    
    # Check Odds API if we haven't checked in the last hour
    if (api_status["odds_api"]["last_checked"] is None or 
        (current_time - api_status["odds_api"]["last_checked"]).total_seconds() > 3600):
        check_odds_api_status()
    
    # Check SportsDB API if we haven't checked in the last hour
    if (api_status["sportsdb_api"]["last_checked"] is None or 
        (current_time - api_status["sportsdb_api"]["last_checked"]).total_seconds() > 3600):
        check_sportsdb_api_status()
    
    # Determine overall status
    overall_status = "ok"
    
    if (api_status["odds_api"]["status"] == "error" or 
        api_status["sportsdb_api"]["status"] == "error"):
        overall_status = "error"
    elif (api_status["odds_api"]["status"] == "degraded" or 
          api_status["sportsdb_api"]["status"] == "degraded"):
        overall_status = "degraded"
    
    return jsonify({
        "overall": overall_status,
        "services": {
            "odds_api": {
                "status": api_status["odds_api"]["status"],
                "message": api_status["odds_api"]["message"],
                "requests_remaining": api_status["odds_api"]["requests_remaining"]
            },
            "sportsdb_api": {
                "status": api_status["sportsdb_api"]["status"],
                "message": api_status["sportsdb_api"]["message"]
            }
        },
        "timestamp": datetime.now().isoformat()
    })

def check_odds_api_status():
    """Check The Odds API status and update the status tracker"""
    if not ODDS_API_KEY:
        api_status["odds_api"]["status"] = "error"
        api_status["odds_api"]["message"] = "API key not configured"
        api_status["odds_api"]["last_checked"] = datetime.now()
        return
    
    try:
        # Use the sports endpoint to check status
        response = requests.get(
            f"{ODDS_API_BASE_URL}/sports",
            params={"apiKey": ODDS_API_KEY}
        )
        
        # Update last checked time
        api_status["odds_api"]["last_checked"] = datetime.now()
        
        if response.status_code == 200:
            # Get remaining requests from headers
            remaining = response.headers.get('x-requests-remaining', 'unknown')
            api_status["odds_api"]["requests_remaining"] = remaining
            
            # Update status based on remaining requests
            if remaining != 'unknown' and int(remaining) < 10:
                api_status["odds_api"]["status"] = "degraded"
                api_status["odds_api"]["message"] = f"Low on API calls: {remaining} remaining"
            else:
                api_status["odds_api"]["status"] = "ok"
                api_status["odds_api"]["message"] = "API available"
        
        elif response.status_code == 401:
            api_status["odds_api"]["status"] = "error"
            api_status["odds_api"]["message"] = "API key invalid"
        
        elif response.status_code == 429:
            api_status["odds_api"]["status"] = "error"
            api_status["odds_api"]["message"] = "Rate limit exceeded"
            api_status["odds_api"]["requests_remaining"] = "0"
        
        else:
            api_status["odds_api"]["status"] = "error"
            api_status["odds_api"]["message"] = f"API error: {response.status_code}"
    
    except Exception as e:
        api_status["odds_api"]["status"] = "error"
        api_status["odds_api"]["message"] = f"Connection error: {str(e)}"

def check_sportsdb_api_status():
    """Check TheSportsDB API status and update the status tracker"""
    if not SPORTS_DB_API_KEY:
        api_status["sportsdb_api"]["status"] = "error"
        api_status["sportsdb_api"]["message"] = "API key not configured"
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        return
    
    try:
        # Use the leagues endpoint to check status
        response = requests.get(
            f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/all_leagues.php"
        )
        
        # Update last checked time
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        
        if response.status_code == 200:
            api_status["sportsdb_api"]["status"] = "ok"
            api_status["sportsdb_api"]["message"] = "API available"
        
        elif response.status_code == 401:
            api_status["sportsdb_api"]["status"] = "error"
            api_status["sportsdb_api"]["message"] = "API key invalid"
        
        elif response.status_code == 429:
            api_status["sportsdb_api"]["status"] = "degraded"
            api_status["sportsdb_api"]["message"] = "Rate limit exceeded"
        
        else:
            api_status["sportsdb_api"]["status"] = "error"
            api_status["sportsdb_api"]["message"] = f"API error: {response.status_code}"
    
    except Exception as e:
        api_status["sportsdb_api"]["status"] = "error"
        api_status["sportsdb_api"]["message"] = f"Connection error: {str(e)}"

# Get available sports
@app.route('/api/sports', methods=['GET'])
def get_sports():
    if not ODDS_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (ODDS_API_KEY)"
        }), 401
    
    try:
        # Get sports from The Odds API
        response = requests.get(
            f"{ODDS_API_BASE_URL}/sports",
            params={"apiKey": ODDS_API_KEY}
        )
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Process the response to add extra metadata
        sports = response.json()
        
        # Get the number of remaining requests
        remaining = response.headers.get('x-requests-remaining', 'unknown')
        
        # Update the API status
        api_status["odds_api"]["status"] = "ok"
        api_status["odds_api"]["message"] = "API available"
        api_status["odds_api"]["requests_remaining"] = remaining
        api_status["odds_api"]["last_checked"] = datetime.now()
        
        return jsonify({
            "sports": sports,
            "requests_remaining": remaining
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching sports data: {str(e)}"
        }), 500

# Get odds for a specific sport
@app.route('/api/odds/<string:sport>', methods=['GET'])
def get_odds(sport):
    if not ODDS_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (ODDS_API_KEY)"
        }), 401
    
    try:
        # Get parameters from request
        regions = request.args.get('regions', 'uk')
        markets = request.args.get('markets', 'h2h')
        date_format = request.args.get('dateFormat', 'iso')
        odds_format = request.args.get('oddsFormat', 'decimal')
        
        # Get odds from The Odds API
        response = requests.get(
            f"{ODDS_API_BASE_URL}/sports/{sport}/odds",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": regions,
                "markets": markets,
                "dateFormat": date_format,
                "oddsFormat": odds_format
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Get the odds data
        odds_data = response.json()
        
        # Get the number of remaining requests
        remaining = response.headers.get('x-requests-remaining', 'unknown')
        
        # Update the API status
        api_status["odds_api"]["status"] = "ok"
        api_status["odds_api"]["message"] = "API available"
        api_status["odds_api"]["requests_remaining"] = remaining
        api_status["odds_api"]["last_checked"] = datetime.now()
        
        # Convert the odds data to our standardized format
        standardized_matches = convert_to_standardized_matches(odds_data, sport)
        
        return jsonify({
            "sport": sport,
            "matches": standardized_matches,
            "requests_remaining": remaining,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching odds data: {str(e)}"
        }), 500

def convert_to_standardized_matches(odds_data, sport):
    """Convert odds API data to standardized match objects"""
    standardized_matches = []
    
    for event in odds_data:
        try:
            # Common fields for all sports
            match = {
                "matchId": event.get("id"),
                "sport": sport,
                "league": event.get("sport_title"),
                "homeTeam": event.get("home_team"),
                "awayTeam": event.get("away_team"),
                "startTime": event.get("commence_time"),
                "status": "NS",  # Not Started
                "dataSource": "OddsAPI",
                "isRealTimeData": True,
                "markets": {}
            }
            
            # Extract betting markets
            for bookmaker in event.get("bookmakers", []):
                # We'll use the first bookmaker we find for simplicity
                # In a production app, you might want to compare multiple bookmakers
                if bookmaker.get("markets"):
                    for market in bookmaker.get("markets"):
                        market_key = market.get("key")
                        
                        if market_key == "h2h":
                            # Head to head (1X2) market
                            home_price = None
                            away_price = None
                            draw_price = None
                            
                            for outcome in market.get("outcomes", []):
                                if outcome.get("name") == match["homeTeam"]:
                                    home_price = outcome.get("price")
                                elif outcome.get("name") == match["awayTeam"]:
                                    away_price = outcome.get("price")
                                elif outcome.get("name") == "Draw":
                                    draw_price = outcome.get("price")
                            
                            # Add to match
                            match["homeOdds"] = home_price
                            match["awayOdds"] = away_price
                            match["drawOdds"] = draw_price
                        
                        elif market_key == "totals":
                            # Over/under market
                            match["markets"]["overUnder"] = {
                                "line": None,
                                "over": None,
                                "under": None
                            }
                            
                            for outcome in market.get("outcomes", []):
                                if outcome.get("name") == "Over":
                                    match["markets"]["overUnder"]["over"] = outcome.get("price")
                                    match["markets"]["overUnder"]["line"] = outcome.get("point")
                                elif outcome.get("name") == "Under":
                                    match["markets"]["overUnder"]["under"] = outcome.get("price")
                    
                    # Only process the first bookmaker
                    break
            
            standardized_matches.append(match)
        
        except Exception as e:
            # Skip events that can't be parsed
            print(f"Error parsing event: {str(e)}")
            continue
    
    return standardized_matches

# Get live scores
@app.route('/api/livescore', methods=['GET'])
def get_livescore():
    if not SPORTS_DB_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (SPORTS_DB_API_KEY)"
        }), 401
    
    try:
        # Get parameters from request
        league_id = request.args.get('league', None)
        
        # Build the API URL based on parameters
        if league_id:
            # Get live scores for a specific league
            api_url = f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/livescore.php?l={league_id}"
        else:
            # Get all live scores
            api_url = f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/livescore.php"
        
        # Make the API request
        response = requests.get(api_url)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Get the live score data
        livescore_data = response.json()
        
        # Update the API status
        api_status["sportsdb_api"]["status"] = "ok"
        api_status["sportsdb_api"]["message"] = "API available"
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        
        # Process the live score data
        matches = livescore_data.get("events", [])
        
        # Convert to standardized format
        standardized_matches = []
        
        for match in matches:
            standardized_match = {
                "matchId": match.get("idEvent"),
                "sport": "soccer",  # TheSportsDB primarily focuses on soccer
                "league": match.get("strLeague"),
                "homeTeam": match.get("strHomeTeam"),
                "awayTeam": match.get("strAwayTeam"),
                "startTime": match.get("strTimestamp"),
                "status": match.get("strStatus", "NS"),
                "score": {
                    "homeScore": match.get("intHomeScore"),
                    "awayScore": match.get("intAwayScore")
                },
                "venue": match.get("strVenue"),
                "dataSource": "TheSportsDB",
                "isRealTimeData": True
            }
            
            standardized_matches.append(standardized_match)
        
        return jsonify({
            "matches": standardized_matches,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching livescore data: {str(e)}"
        }), 500

# Get league fixtures
@app.route('/api/fixtures/league/<string:league_id>', methods=['GET'])
def get_league_fixtures(league_id):
    if not SPORTS_DB_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (SPORTS_DB_API_KEY)"
        }), 401
    
    try:
        # Get future fixtures for a league
        api_url = f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/eventsnextleague.php?id={league_id}"
        
        # Make the API request
        response = requests.get(api_url)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Get the fixtures data
        fixtures_data = response.json()
        
        # Update the API status
        api_status["sportsdb_api"]["status"] = "ok"
        api_status["sportsdb_api"]["message"] = "API available"
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        
        # Process the fixtures data
        events = fixtures_data.get("events", [])
        
        return jsonify({
            "league": league_id,
            "fixtures": events,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching fixtures data: {str(e)}"
        }), 500

# Get teams in a league
@app.route('/api/teams/league/<string:league_id>', methods=['GET'])
def get_teams(league_id):
    if not SPORTS_DB_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (SPORTS_DB_API_KEY)"
        }), 401
    
    try:
        # Get teams in a league
        api_url = f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/lookup_all_teams.php?id={league_id}"
        
        # Make the API request
        response = requests.get(api_url)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Get the teams data
        teams_data = response.json()
        
        # Update the API status
        api_status["sportsdb_api"]["status"] = "ok"
        api_status["sportsdb_api"]["message"] = "API available"
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        
        # Process the teams data
        teams = teams_data.get("teams", [])
        
        return jsonify({
            "league": league_id,
            "teams": teams,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching teams data: {str(e)}"
        }), 500

# Get all leagues
@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    if not SPORTS_DB_API_KEY:
        return jsonify({
            "status": "error",
            "message": "API key not configured (SPORTS_DB_API_KEY)"
        }), 401
    
    try:
        # Get all leagues
        api_url = f"{SPORTSDB_API_BASE_URL}/{SPORTS_DB_API_KEY}/all_leagues.php"
        
        # Make the API request
        response = requests.get(api_url)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"API error: {response.status_code}"
            }), response.status_code
        
        # Get the leagues data
        leagues_data = response.json()
        
        # Update the API status
        api_status["sportsdb_api"]["status"] = "ok"
        api_status["sportsdb_api"]["message"] = "API available"
        api_status["sportsdb_api"]["last_checked"] = datetime.now()
        
        # Process the leagues data
        leagues = leagues_data.get("leagues", [])
        
        return jsonify({
            "leagues": leagues,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error fetching leagues data: {str(e)}"
        }), 500

if __name__ == "__main__":
    # Check the API status on startup
    check_odds_api_status()
    check_sportsdb_api_status()
    
    # Print API status
    print("API Status:")
    print(f"Odds API: {api_status['odds_api']['status']} - {api_status['odds_api']['message']}")
    print(f"SportsDB API: {api_status['sportsdb_api']['status']} - {api_status['sportsdb_api']['message']}")
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=5000, debug=True)