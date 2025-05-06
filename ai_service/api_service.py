"""
Flask API service for PuntaIQ
Provides sports data and odds integrations
"""

import os
import sys
import json
import logging
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Import our custom modules
from api_integrations import api_football
from api_integrations import thesportsdb
from api_integrations import balldontlie
from firebase_init import (
    initialize_firebase,
    get_sports_fixtures,
    get_db_reference
)
from cron_jobs import scheduler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api_service')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# API Status Tracker
api_status = {
    "odds_api": {
        "status": "unknown",
        "last_check": None,
        "message": "Status not checked yet"
    },
    "sportsdb_api": {
        "status": "unknown",
        "last_check": None,
        "message": "Status not checked yet"
    },
    "balldontlie_api": {
        "status": "unknown",
        "last_check": None,
        "message": "Status not checked yet"
    },
    "firebase": {
        "status": "unknown",
        "last_check": None,
        "message": "Status not checked yet"
    }
}

# Initialize Firebase
firebase_app = initialize_firebase()
if firebase_app:
    api_status["firebase"] = {
        "status": "online",
        "last_check": datetime.now().isoformat(),
        "message": "Firebase connection established"
    }
else:
    api_status["firebase"] = {
        "status": "offline",
        "last_check": datetime.now().isoformat(),
        "message": "Firebase connection failed"
    }

# CORS Headers
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

# Service Status Endpoint
@app.route('/status', methods=['GET'])
def get_status():
    """Get the service status including API connections."""
    status_data = {
        "service": "PuntaIQ API Service",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "apis": api_status
    }
    
    # Check if all APIs are online
    apis_online = all(api["status"] == "online" for api in api_status.values())
    if not apis_online:
        status_data["status"] = "degraded"
        status_data["message"] = "One or more APIs are not available"
    
    return jsonify(status_data)

# API Status Check Functions
@app.route('/check-api-status', methods=['GET'])
def check_api_status():
    """Trigger a check of all API connections."""
    # Check all APIs in separate thread to avoid blocking
    threading.Thread(target=_check_all_apis).start()
    return jsonify({"message": "API status check initiated"})

def _check_all_apis():
    """Check the status of all integrated APIs."""
    check_odds_api_status()
    check_sportsdb_api_status()
    check_balldontlie_api_status()
    check_firebase_status()

def check_odds_api_status():
    """Check The Odds API status and update the status tracker."""
    try:
        success, response = api_football.test_api_connection()
        
        api_status["odds_api"] = {
            "status": "online" if success else "offline",
            "last_check": datetime.now().isoformat(),
            "message": "Connection test successful" if success else "Connection test failed"
        }
        
        logger.info(f"API-Football status check: {'Online' if success else 'Offline'}")
    
    except Exception as e:
        api_status["odds_api"] = {
            "status": "error",
            "last_check": datetime.now().isoformat(),
            "message": f"Error checking status: {str(e)}"
        }
        
        logger.error(f"Error during API-Football status check: {str(e)}")

def check_sportsdb_api_status():
    """Check TheSportsDB API status and update the status tracker."""
    try:
        success, response = thesportsdb.test_api_connection()
        
        api_status["sportsdb_api"] = {
            "status": "online" if success else "offline",
            "last_check": datetime.now().isoformat(),
            "message": "Connection test successful" if success else "Connection test failed"
        }
        
        logger.info(f"TheSportsDB status check: {'Online' if success else 'Offline'}")
    
    except Exception as e:
        api_status["sportsdb_api"] = {
            "status": "error",
            "last_check": datetime.now().isoformat(),
            "message": f"Error checking status: {str(e)}"
        }
        
        logger.error(f"Error during TheSportsDB status check: {str(e)}")

def check_balldontlie_api_status():
    """Check BallDontLie API status and update the status tracker."""
    try:
        success, response = balldontlie.test_api_connection()
        
        api_status["balldontlie_api"] = {
            "status": "online" if success else "offline",
            "last_check": datetime.now().isoformat(),
            "message": "Connection test successful" if success else "Connection test failed"
        }
        
        logger.info(f"BallDontLie status check: {'Online' if success else 'Offline'}")
    
    except Exception as e:
        api_status["balldontlie_api"] = {
            "status": "error",
            "last_check": datetime.now().isoformat(),
            "message": f"Error checking status: {str(e)}"
        }
        
        logger.error(f"Error during BallDontLie status check: {str(e)}")

def check_firebase_status():
    """Check Firebase connection status."""
    try:
        # Try to access Firebase
        if not firebase_app:
            api_status["firebase"] = {
                "status": "offline",
                "last_check": datetime.now().isoformat(),
                "message": "Firebase not initialized"
            }
            return
        
        # Try to read a value
        ref = get_db_reference()
        if not ref:
            api_status["firebase"] = {
                "status": "error",
                "last_check": datetime.now().isoformat(),
                "message": "Could not get database reference"
            }
            return
        
        # Check if we can read something
        try:
            # Try to read the status node or create it
            status_ref = ref.child("service_status")
            status_ref.set({
                "last_check": datetime.now().isoformat(),
                "service": "api_service"
            })
            
            api_status["firebase"] = {
                "status": "online",
                "last_check": datetime.now().isoformat(),
                "message": "Firebase connection is active"
            }
            
            logger.info("Firebase status check: Online")
        
        except Exception as e:
            api_status["firebase"] = {
                "status": "error",
                "last_check": datetime.now().isoformat(),
                "message": f"Firebase read/write error: {str(e)}"
            }
            
            logger.error(f"Error during Firebase read/write check: {str(e)}")
    
    except Exception as e:
        api_status["firebase"] = {
            "status": "error",
            "last_check": datetime.now().isoformat(),
            "message": f"Error checking Firebase status: {str(e)}"
        }
        
        logger.error(f"Error during Firebase status check: {str(e)}")

# Sports Data Endpoints
@app.route('/sports', methods=['GET'])
def get_sports():
    """Get list of available sports and their status."""
    sports_list = [
        {
            "id": "football",
            "name": "Football/Soccer",
            "active": api_status["odds_api"]["status"] == "online",
            "icon": "football",
            "api_source": "API-Football"
        },
        {
            "id": "basketball",
            "name": "Basketball",
            "active": api_status["balldontlie_api"]["status"] == "online",
            "icon": "basketball",
            "api_source": "BallDontLie (NBA)"
        },
        {
            "id": "baseball",
            "name": "Baseball",
            "active": api_status["sportsdb_api"]["status"] == "online",
            "icon": "baseball",
            "api_source": "TheSportsDB"
        },
        {
            "id": "hockey",
            "name": "Ice Hockey",
            "active": api_status["sportsdb_api"]["status"] == "online",
            "icon": "hockey",
            "api_source": "TheSportsDB"
        },
        {
            "id": "american_football",
            "name": "American Football",
            "active": api_status["sportsdb_api"]["status"] == "online",
            "icon": "american_football",
            "api_source": "TheSportsDB"
        },
        {
            "id": "tennis",
            "name": "Tennis",
            "active": api_status["sportsdb_api"]["status"] == "online",
            "icon": "tennis",
            "api_source": "TheSportsDB"
        }
    ]
    
    return jsonify({
        "sports": sports_list,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/odds/<sport>', methods=['GET'])
def get_odds(sport):
    """Get odds for a specific sport."""
    try:
        # Map sport to API
        if sport == "football":
            # Get upcoming matches with odds
            days_ahead = request.args.get('days', default=3, type=int)
            fixtures_data = api_football.get_upcoming_matches(days_ahead=days_ahead)
            
            # Check if we got data
            if not fixtures_data or "errors" in fixtures_data:
                return jsonify({
                    "error": "Could not retrieve football odds",
                    "matches": [],
                    "timestamp": datetime.now().isoformat()
                })
            
            # Convert to standardized format
            matches = convert_to_standardized_matches(fixtures_data.get("data", []), sport)
            
            return jsonify({
                "matches": matches,
                "count": len(matches),
                "timestamp": datetime.now().isoformat()
            })
        
        elif sport == "basketball":
            # Get upcoming NBA games
            days_ahead = request.args.get('days', default=3, type=int)
            games_data = balldontlie.get_upcoming_games(days_ahead=days_ahead)
            
            # Check if we got data
            if not games_data or "error" in games_data:
                return jsonify({
                    "error": "Could not retrieve basketball odds",
                    "matches": [],
                    "timestamp": datetime.now().isoformat()
                })
            
            # Convert to standardized matches
            matches = []
            for game in games_data.get("data", []):
                matches.append({
                    "id": game.get("id"),
                    "sport": "basketball",
                    "league": "NBA",
                    "country": "USA",
                    "home_team": game.get("home_team", {}).get("name"),
                    "away_team": game.get("away_team", {}).get("name"),
                    "start_time": game.get("date"),
                    "status": game.get("status"),
                    "home_odds": None,  # BallDontLie doesn't provide odds
                    "away_odds": None,
                    "draw_odds": None
                })
            
            return jsonify({
                "matches": matches,
                "count": len(matches),
                "timestamp": datetime.now().isoformat()
            })
        
        else:
            # For other sports, use TheSportsDB
            events_data = thesportsdb.get_upcoming_events_by_sport(sport, days=7)
            
            # Check if we got data
            if not events_data or "error" in events_data:
                return jsonify({
                    "error": f"Could not retrieve {sport} odds",
                    "matches": [],
                    "timestamp": datetime.now().isoformat()
                })
            
            # Convert to standardized matches
            matches = []
            for event in events_data.get("data", []):
                matches.append({
                    "id": event.get("id"),
                    "sport": sport,
                    "league": event.get("league", {}).get("name"),
                    "country": "",  # TheSportsDB doesn't always provide country
                    "home_team": event.get("home_team", {}).get("name"),
                    "away_team": event.get("away_team", {}).get("name"),
                    "start_time": event.get("date") + "T" + (event.get("time") or "00:00:00"),
                    "status": "scheduled",
                    "home_odds": None,  # TheSportsDB doesn't provide odds
                    "away_odds": None,
                    "draw_odds": None
                })
            
            return jsonify({
                "matches": matches,
                "count": len(matches),
                "timestamp": datetime.now().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Error retrieving odds for {sport}: {str(e)}")
        return jsonify({
            "error": f"Error retrieving odds: {str(e)}",
            "matches": [],
            "timestamp": datetime.now().isoformat()
        })

def convert_to_standardized_matches(odds_data, sport):
    """Convert odds API data to standardized match objects."""
    matches = []
    
    for fixture in odds_data:
        match = {
            "id": fixture.get("id"),
            "sport": sport,
            "league": fixture.get("league", {}).get("name"),
            "country": fixture.get("league", {}).get("country"),
            "home_team": fixture.get("home_team", {}).get("name"),
            "away_team": fixture.get("away_team", {}).get("name"),
            "start_time": fixture.get("date"),
            "status": fixture.get("status"),
            "home_odds": None,  # Would be populated from odds data if available
            "away_odds": None,
            "draw_odds": None
        }
        
        matches.append(match)
    
    return matches

@app.route('/livescore', methods=['GET'])
def get_livescore():
    """Get live scores for in-progress matches."""
    try:
        sport = request.args.get('sport', default='all')
        
        # For football, use API-Football
        if sport == 'all' or sport == 'football':
            live_fixtures = api_football.fetch_live_fixtures()
            
            if "errors" in live_fixtures:
                return jsonify({
                    "error": "Could not retrieve live football scores",
                    "matches": [],
                    "timestamp": datetime.now().isoformat()
                })
            
            # Process live fixtures
            matches = []
            for fixture in live_fixtures.get("response", []):
                fixture_data = fixture.get("fixture", {})
                teams = fixture.get("teams", {})
                goals = fixture.get("goals", {})
                
                matches.append({
                    "id": fixture_data.get("id"),
                    "sport": "football",
                    "league": fixture.get("league", {}).get("name"),
                    "country": fixture.get("league", {}).get("country"),
                    "home_team": teams.get("home", {}).get("name"),
                    "away_team": teams.get("away", {}).get("name"),
                    "home_score": goals.get("home"),
                    "away_score": goals.get("away"),
                    "status": fixture_data.get("status", {}).get("short"),
                    "elapsed_time": fixture_data.get("status", {}).get("elapsed")
                })
            
            return jsonify({
                "matches": matches,
                "count": len(matches),
                "timestamp": datetime.now().isoformat()
            })
        
        # For basketball, would need live score API which BallDontLie doesn't provide freely
        # For now, return empty list with appropriate message
        return jsonify({
            "error": f"Live scores for {sport} not currently available",
            "matches": [],
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error retrieving live scores: {str(e)}")
        return jsonify({
            "error": f"Error retrieving live scores: {str(e)}",
            "matches": [],
            "timestamp": datetime.now().isoformat()
        })

@app.route('/fixtures/league/<int:league_id>', methods=['GET'])
def get_league_fixtures(league_id):
    """Get fixtures for a specific league."""
    try:
        # Get season (default to current year)
        current_year = datetime.now().year
        season = request.args.get('season', default=current_year, type=int)
        
        # Get fixtures
        fixtures_data = api_football.fetch_fixtures(league_id=league_id, season=season)
        
        if "errors" in fixtures_data:
            return jsonify({
                "error": "Could not retrieve league fixtures",
                "fixtures": [],
                "timestamp": datetime.now().isoformat()
            })
        
        # Process fixtures
        fixtures = []
        for fixture in fixtures_data.get("response", []):
            fixture_data = fixture.get("fixture", {})
            teams = fixture.get("teams", {})
            
            fixtures.append({
                "id": fixture_data.get("id"),
                "date": fixture_data.get("date"),
                "home_team": teams.get("home", {}).get("name"),
                "away_team": teams.get("away", {}).get("name"),
                "status": fixture_data.get("status", {}).get("short")
            })
        
        return jsonify({
            "fixtures": fixtures,
            "count": len(fixtures),
            "league_id": league_id,
            "season": season,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error retrieving league fixtures: {str(e)}")
        return jsonify({
            "error": f"Error retrieving league fixtures: {str(e)}",
            "fixtures": [],
            "timestamp": datetime.now().isoformat()
        })

@app.route('/teams/<int:league_id>', methods=['GET'])
def get_teams(league_id):
    """Get teams for a specific league."""
    try:
        # Get season (default to current year)
        current_year = datetime.now().year
        season = request.args.get('season', default=current_year, type=int)
        
        # Get teams
        teams_data = api_football.fetch_teams(league_id, season)
        
        if "errors" in teams_data:
            return jsonify({
                "error": "Could not retrieve teams",
                "teams": [],
                "timestamp": datetime.now().isoformat()
            })
        
        # Process teams
        teams = []
        for team in teams_data.get("response", []):
            team_data = team.get("team", {})
            
            teams.append({
                "id": team_data.get("id"),
                "name": team_data.get("name"),
                "country": team_data.get("country"),
                "logo": team_data.get("logo")
            })
        
        return jsonify({
            "teams": teams,
            "count": len(teams),
            "league_id": league_id,
            "season": season,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error retrieving teams: {str(e)}")
        return jsonify({
            "error": f"Error retrieving teams: {str(e)}",
            "teams": [],
            "timestamp": datetime.now().isoformat()
        })

@app.route('/leagues', methods=['GET'])
def get_leagues():
    """Get available leagues."""
    try:
        # Get current season
        current_year = datetime.now().year
        
        # Get football leagues
        football_leagues_data = api_football.fetch_leagues(current=True)
        
        if "errors" in football_leagues_data:
            return jsonify({
                "error": "Could not retrieve leagues",
                "leagues": [],
                "timestamp": datetime.now().isoformat()
            })
        
        # Process leagues
        leagues = []
        for league in football_leagues_data.get("response", []):
            league_data = league.get("league", {})
            country = league.get("country", {})
            
            leagues.append({
                "id": league_data.get("id"),
                "name": league_data.get("name"),
                "country": country.get("name"),
                "logo": league_data.get("logo"),
                "sport": "football"
            })
        
        # For basketball, get NBA league info
        leagues.append({
            "id": 0,  # BallDontLie doesn't use league IDs
            "name": "NBA",
            "country": "USA",
            "logo": None,
            "sport": "basketball"
        })
        
        return jsonify({
            "leagues": leagues,
            "count": len(leagues),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error retrieving leagues: {str(e)}")
        return jsonify({
            "error": f"Error retrieving leagues: {str(e)}",
            "leagues": [],
            "timestamp": datetime.now().isoformat()
        })

# Server startup function with background scheduler
def start_server():
    # Start the cron job scheduler in a separate thread
    threading.Thread(target=_run_cron_jobs, daemon=True).start()
    
    # Check API status on startup
    _check_all_apis()
    
    # Start the Flask application
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

def _run_cron_jobs():
    """Run cron jobs in the background."""
    logger.info("Starting background cron job scheduler")
    
    try:
        # Run initial job
        scheduler.run_all_jobs()
        
        # Enter the main loop
        while True:
            # Sleep for a minute before checking again
            time.sleep(60)
            scheduler.run_all_jobs()
    
    except Exception as e:
        logger.error(f"Error in cron job scheduler: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting PuntaIQ API Service")
    start_server()