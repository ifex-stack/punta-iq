"""
Main entry point for the AI Sports Prediction service.
This module initializes the Flask application and starts the server.
"""

import os
import json
import logging
import threading
from datetime import datetime, timedelta

# Flask imports
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import configuration
from config import (
    PORT, ENV, API_FOOTBALL_KEY, THESPORTSDB_API_KEY, 
    BALLDONTLIE_API_KEY, validate_config
)

# Import API integrations
from api_integrations.api_football import (
    test_api_connection as test_football_api,
    get_upcoming_matches as get_football_matches
)
from api_integrations.thesportsdb import (
    test_api_connection as test_sportsdb_api,
    get_upcoming_events_by_sport
)
from api_integrations.balldontlie import (
    test_api_connection as test_balldontlie_api,
    get_upcoming_games as get_basketball_games
)

# Import Firebase services
from firebase_init import (
    initialize_firebase as init_firebase, 
    get_from_firebase, 
    save_to_firebase
)

# Import scheduler for cron jobs
from cron_jobs import start_scheduler, stop_scheduler, run_job_now, get_scheduler_status

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global service status
service_status = {
    "online": True,
    "startup_time": datetime.now().isoformat(),
    "api_services": {
        "football": False,
        "basketball": False,
        "sports_db": False
    },
    "firebase": False,
    "scheduler": False
}

# Initialize services
def initialize_services():
    """Initialize all required services."""
    global service_status
    
    # 1. Validate configuration
    if not validate_config():
        logger.warning("Configuration validation failed")
    
    # 2. Initialize Firebase
    try:
        firebase_initialized = init_firebase()
        service_status["firebase"] = firebase_initialized
        if firebase_initialized:
            logger.info("Firebase initialized successfully")
        else:
            logger.warning("Firebase initialization failed")
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        service_status["firebase"] = False
    
    # 3. Test API connections
    try:
        # Test football API
        football_success, _ = test_football_api()
        service_status["api_services"]["football"] = football_success
        logger.info(f"Football API connection: {'Success' if football_success else 'Failed'}")
        
        # Test sports DB API
        sportsdb_success, _ = test_sportsdb_api()
        service_status["api_services"]["sports_db"] = sportsdb_success
        logger.info(f"SportsDB API connection: {'Success' if sportsdb_success else 'Failed'}")
        
        # Test basketball API
        basketball_success, _ = test_balldontlie_api()
        service_status["api_services"]["basketball"] = basketball_success
        logger.info(f"Basketball API connection: {'Success' if basketball_success else 'Failed'}")
    
    except Exception as e:
        logger.error(f"Error testing API connections: {e}")
    
    # 4. Start scheduler if in production mode
    if ENV == 'production':
        try:
            scheduler_started = start_scheduler()
            service_status["scheduler"] = scheduler_started
            if scheduler_started:
                logger.info("Job scheduler started successfully")
            else:
                logger.warning("Job scheduler failed to start")
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            service_status["scheduler"] = False
    else:
        logger.info("Scheduler not started in development mode")
    
    logger.info("Service initialization complete")

# API Routes
@app.route('/status', methods=['GET'])
def status():
    """Health check endpoint."""
    global service_status
    
    return jsonify({
        "status": "online",
        "message": "The AI sports prediction service is running",
        "timestamp": datetime.now().isoformat(),
        "uptime": (datetime.now() - datetime.fromisoformat(service_status["startup_time"])).total_seconds(),
        "services": {
            "firebase": "connected" if service_status["firebase"] else "disconnected",
            "api_services": {
                name: "connected" if status else "disconnected" 
                for name, status in service_status["api_services"].items()
            },
            "scheduler": "running" if service_status["scheduler"] else "stopped"
        }
    })

@app.route('/api/sports', methods=['GET'])
def get_sports():
    """Get list of supported sports."""
    sports = [
        {
            "id": "football",
            "name": "Football (Soccer)",
            "supported": service_status["api_services"]["football"],
            "icon": "football"
        },
        {
            "id": "basketball",
            "name": "Basketball",
            "supported": service_status["api_services"]["basketball"],
            "icon": "basketball"
        }
    ]
    
    return jsonify({
        "data": sports,
        "count": len(sports),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/football/matches', methods=['GET'])
def football_matches():
    """Get upcoming football matches."""
    try:
        # Get query parameters
        days_ahead = request.args.get('days', default=3, type=int)
        league_ids = request.args.getlist('league_id')
        
        # Convert league_ids to integers if provided
        if league_ids:
            league_ids = [int(lid) for lid in league_ids]
        else:
            # Default to major leagues if none specified
            league_ids = [39, 140, 135, 78, 61]  # Premier League, La Liga, Serie A, Bundesliga, Ligue 1
        
        # Get matches from API or Firebase
        use_cached = request.args.get('cached', default='true').lower() == 'true'
        
        if use_cached and service_status["firebase"]:
            # Try to get from Firebase first
            today = datetime.now().strftime("%Y-%m-%d")
            future_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
            # Get available dates from index
            index_data = get_from_firebase('/fixtures/football/index')
            if index_data and 'available_dates' in index_data:
                available_dates = index_data['available_dates']
                
                # Filter dates within our range
                dates_in_range = [date for date in available_dates 
                                 if today <= date <= future_date]
                
                if dates_in_range:
                    all_matches = []
                    for date in dates_in_range:
                        date_data = get_from_firebase(f'/fixtures/football/{date}')
                        if date_data and 'matches' in date_data:
                            all_matches.extend(date_data['matches'])
                    
                    return jsonify({
                        "data": all_matches,
                        "count": len(all_matches),
                        "source": "firebase",
                        "timestamp": datetime.now().isoformat()
                    })
        
        # If we reach here, we need to fetch from API
        matches = get_football_matches(league_ids, days_ahead)
        
        return jsonify({
            "data": matches.get('data', []),
            "count": len(matches.get('data', [])),
            "source": "api",
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in football_matches: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/basketball/games', methods=['GET'])
def basketball_games():
    """Get upcoming basketball games."""
    try:
        # Get query parameters
        days_ahead = request.args.get('days', default=3, type=int)
        
        # Get games from API or Firebase
        use_cached = request.args.get('cached', default='true').lower() == 'true'
        
        if use_cached and service_status["firebase"]:
            # Try to get from Firebase first
            today = datetime.now().strftime("%Y-%m-%d")
            future_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
            # Get available dates from index
            index_data = get_from_firebase('/fixtures/basketball/nba/index')
            if index_data and 'available_dates' in index_data:
                available_dates = index_data['available_dates']
                
                # Filter dates within our range
                dates_in_range = [date for date in available_dates 
                                 if today <= date <= future_date]
                
                if dates_in_range:
                    all_games = []
                    for date in dates_in_range:
                        date_data = get_from_firebase(f'/fixtures/basketball/nba/{date}')
                        if date_data and 'games' in date_data:
                            all_games.extend(date_data['games'])
                    
                    return jsonify({
                        "data": all_games,
                        "count": len(all_games),
                        "source": "firebase",
                        "timestamp": datetime.now().isoformat()
                    })
        
        # If we reach here, we need to fetch from API
        games = get_basketball_games(days_ahead)
        
        return jsonify({
            "data": games.get('data', []),
            "count": len(games.get('data', [])),
            "source": "api",
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in basketball_games: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/predictions/<sport>', methods=['GET'])
def get_predictions(sport):
    """Get predictions for a specific sport."""
    try:
        if sport not in ['football', 'basketball']:
            return jsonify({
                "error": f"Unsupported sport: {sport}",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        # Get date parameter, default to today
        date = request.args.get('date', default=datetime.now().strftime("%Y-%m-%d"))
        
        # Get from Firebase
        if service_status["firebase"]:
            predictions_data = get_from_firebase(f'/predictions/{sport}/{date}')
            
            if predictions_data and 'predictions' in predictions_data:
                return jsonify({
                    "data": predictions_data['predictions'],
                    "count": len(predictions_data['predictions']),
                    "date": date,
                    "timestamp": datetime.now().isoformat()
                })
        
        # No predictions found
        return jsonify({
            "data": [],
            "count": 0,
            "date": date,
            "timestamp": datetime.now().isoformat(),
            "message": f"No predictions available for {sport} on {date}"
        })
    
    except Exception as e:
        logger.error(f"Error in get_predictions: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/jobs/status', methods=['GET'])
def jobs_status():
    """Get the status of the scheduler and jobs."""
    try:
        if service_status["scheduler"]:
            status = get_scheduler_status()
            return jsonify({
                "scheduler": status,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "scheduler": {
                    "is_running": False,
                    "message": "Scheduler is not running",
                    "timestamp": datetime.now().isoformat()
                }
            })
    
    except Exception as e:
        logger.error(f"Error in jobs_status: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/jobs/run', methods=['POST'])
def run_job():
    """Run a specific job immediately."""
    try:
        data = request.json
        job_name = data.get('job_name')
        
        if not job_name:
            return jsonify({
                "error": "Missing job_name parameter",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        result = run_job_now(job_name)
        
        return jsonify({
            "job": job_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in run_job: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/test-apis', methods=['GET'])
def test_apis():
    """Test all API connections."""
    results = {}
    
    try:
        # Test football API
        football_success, football_resp = test_football_api()
        results["football"] = {
            "success": football_success,
            "message": "API connection successful" if football_success else "API connection failed"
        }
        
        # Test sports DB API
        sportsdb_success, sportsdb_resp = test_sportsdb_api()
        results["sports_db"] = {
            "success": sportsdb_success,
            "message": "API connection successful" if sportsdb_success else "API connection failed"
        }
        
        # Test basketball API
        basketball_success, basketball_resp = test_balldontlie_api()
        results["basketball"] = {
            "success": basketball_success,
            "message": "API connection successful" if basketball_success else "API connection failed"
        }
        
        # Update service status
        service_status["api_services"]["football"] = football_success
        service_status["api_services"]["sports_db"] = sportsdb_success
        service_status["api_services"]["basketball"] = basketball_success
        
        return jsonify({
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in test_apis: {e}")
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# Main entry point
def main():
    """Main entry point for the service."""
    logger.info("Starting AI Sports Prediction service")
    
    # Initialize services
    threading.Thread(target=initialize_services).start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=PORT, debug=(ENV == 'development'))

# Shutdown handler
def shutdown():
    """Shutdown handler to clean up resources."""
    logger.info("Shutting down AI Sports Prediction service")
    
    # Stop scheduler if running
    if service_status["scheduler"]:
        stop_scheduler()
    
    logger.info("Shutdown complete")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        shutdown()
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        shutdown()