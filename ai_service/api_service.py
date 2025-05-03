"""
Flask API service for PuntaIQ 
Provides sports data and odds integrations
"""

from flask import Flask, jsonify, request, make_response
import requests
import os
import sys
import json
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('PuntaIQ-Microservice')

# Initialize Flask app
app = Flask(__name__)

# API URLs
ODDS_API_URL = "https://api.the-odds-api.com"
# TheSportsDB free tier uses 3 as the API key in the URL
SPORTS_DB_API_URL = "https://www.thesportsdb.com/api/v1/json/3"

# API Keys
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
SPORTS_API_KEY = os.getenv('API_SPORTS_KEY')  # Store this for future premium upgrade

# Status tracker for external services
STATUS_TRACKER = {
    'odds_api': {
        'status': 'unknown',
        'message': 'Not checked yet',
        'last_check': None,
        'requests_remaining': None
    },
    'sportsdb_api': {
        'status': 'unknown',
        'message': 'Not checked yet',
        'last_check': None
    }
}

# Add CORS headers
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

# Health check endpoint
@app.route('/api/status', methods=['GET'])
def get_status():
    # Update status if it's been more than 10 minutes
    check_odds_api_status()
    check_sportsdb_api_status()
    
    # Calculate overall status based on component statuses
    overall = 'ok'
    if STATUS_TRACKER['odds_api']['status'] == 'error' or STATUS_TRACKER['sportsdb_api']['status'] == 'error':
        overall = 'error'
    elif STATUS_TRACKER['odds_api']['status'] == 'degraded' or STATUS_TRACKER['sportsdb_api']['status'] == 'degraded':
        overall = 'degraded'
    
    return jsonify({
        'overall': overall,
        'services': {
            'odds_api': {
                'status': STATUS_TRACKER['odds_api']['status'],
                'message': STATUS_TRACKER['odds_api']['message'],
                'requests_remaining': STATUS_TRACKER['odds_api']['requests_remaining']
            },
            'sportsdb_api': {
                'status': STATUS_TRACKER['sportsdb_api']['status'],
                'message': STATUS_TRACKER['sportsdb_api']['message']
            }
        },
        'timestamp': datetime.now().isoformat()
    })

def check_odds_api_status():
    """Check The Odds API status and update the status tracker"""
    # Only check if key is available
    if not ODDS_API_KEY:
        STATUS_TRACKER['odds_api']['status'] = 'error'
        STATUS_TRACKER['odds_api']['message'] = 'API key not configured'
        STATUS_TRACKER['odds_api']['last_check'] = datetime.now()
        return
    
    # Only check if it's been more than 5 minutes
    if (STATUS_TRACKER['odds_api']['last_check'] and 
        (datetime.now() - STATUS_TRACKER['odds_api']['last_check']).total_seconds() < 300):
        return
    
    try:
        # Simple sports list request to check API status
        url = f"{ODDS_API_URL}/v4/sports?apiKey={ODDS_API_KEY}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            STATUS_TRACKER['odds_api']['status'] = 'ok'
            STATUS_TRACKER['odds_api']['message'] = 'API is operational'
            # Get requests remaining from headers if available
            if 'x-requests-remaining' in response.headers:
                STATUS_TRACKER['odds_api']['requests_remaining'] = response.headers['x-requests-remaining']
        elif response.status_code == 401 or response.status_code == 403:
            STATUS_TRACKER['odds_api']['status'] = 'error'
            STATUS_TRACKER['odds_api']['message'] = 'API key unauthorized'
        elif response.status_code == 429:
            STATUS_TRACKER['odds_api']['status'] = 'degraded'
            STATUS_TRACKER['odds_api']['message'] = 'Rate limited'
        else:
            STATUS_TRACKER['odds_api']['status'] = 'degraded'
            STATUS_TRACKER['odds_api']['message'] = f'API responded with status code {response.status_code}'
    except Exception as e:
        STATUS_TRACKER['odds_api']['status'] = 'error'
        STATUS_TRACKER['odds_api']['message'] = f'Connection error: {str(e)}'
    
    STATUS_TRACKER['odds_api']['last_check'] = datetime.now()

def check_sportsdb_api_status():
    """Check TheSportsDB API status and update the status tracker"""
    # Only check if it's been more than 5 minutes
    if (STATUS_TRACKER['sportsdb_api']['last_check'] and 
        (datetime.now() - STATUS_TRACKER['sportsdb_api']['last_check']).total_seconds() < 300):
        return
    
    try:
        # Simple leagues request to check API status - this endpoint works with free tier
        url = f"{SPORTS_DB_API_URL}/all_leagues.php"
        logger.info(f"Checking SportsDB API status with URL: {url}")
        
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            # Verify we got actual data back
            data = response.json()
            if data and 'leagues' in data and len(data['leagues']) > 0:
                STATUS_TRACKER['sportsdb_api']['status'] = 'ok'
                STATUS_TRACKER['sportsdb_api']['message'] = 'API is operational'
                logger.info("SportsDB API check passed successfully")
            else:
                STATUS_TRACKER['sportsdb_api']['status'] = 'degraded'
                STATUS_TRACKER['sportsdb_api']['message'] = 'API responded with empty data'
                logger.warning("SportsDB API returned empty data")
        elif response.status_code == 401 or response.status_code == 403:
            STATUS_TRACKER['sportsdb_api']['status'] = 'error'
            STATUS_TRACKER['sportsdb_api']['message'] = 'API unauthorized'
            logger.error(f"SportsDB API unauthorized: {response.status_code}")
        elif response.status_code == 429:
            STATUS_TRACKER['sportsdb_api']['status'] = 'degraded'
            STATUS_TRACKER['sportsdb_api']['message'] = 'Rate limited'
            logger.warning("SportsDB API rate limited")
        else:
            STATUS_TRACKER['sportsdb_api']['status'] = 'degraded'
            STATUS_TRACKER['sportsdb_api']['message'] = f'API responded with status code {response.status_code}'
            logger.warning(f"SportsDB API responded with status code {response.status_code}")
    except Exception as e:
        STATUS_TRACKER['sportsdb_api']['status'] = 'error'
        STATUS_TRACKER['sportsdb_api']['message'] = f'Connection error: {str(e)}'
        logger.error(f"SportsDB API connection error: {str(e)}")
    
    STATUS_TRACKER['sportsdb_api']['last_check'] = datetime.now()

# Get supported sports
@app.route('/api/sports', methods=['GET'])
def get_sports():
    if not ODDS_API_KEY:
        logger.warning("OddsAPI key not configured")
        # Return a more helpful error message
        return jsonify({
            'error': 'OddsAPI key not configured',
            'message': 'Please configure a valid OddsAPI key to access sports data',
            'status': 'error'
        }), 401
    
    try:
        logger.info("Getting supported sports from OddsAPI")
        url = f"{ODDS_API_URL}/v4/sports?apiKey={ODDS_API_KEY}"
        logger.info(f"Fetching sports data from URL: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"OddsAPI responded with status code {response.status_code}")
            error_message = f'OddsAPI responded with status code {response.status_code}'
            
            # Add more context based on common error codes
            if response.status_code == 401:
                error_message = 'OddsAPI key is invalid or expired'
            elif response.status_code == 429:
                error_message = 'OddsAPI rate limit exceeded. Please try again later.'
                
            return jsonify({
                'error': error_message,
                'status': 'error'
            }), response.status_code
        
        sports_data = response.json()
        
        # Update requests remaining
        if 'x-requests-remaining' in response.headers:
            STATUS_TRACKER['odds_api']['requests_remaining'] = response.headers['x-requests-remaining']
            logger.info(f"OddsAPI requests remaining: {STATUS_TRACKER['odds_api']['requests_remaining']}")
        
        return jsonify(sports_data)
    except Exception as e:
        logger.error(f"Error fetching sports data: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Failed to connect to OddsAPI. Please check your internet connection and try again.',
            'status': 'error'
        }), 500

# Get odds for a specific sport
@app.route('/api/odds/<sport>', methods=['GET'])
def get_odds(sport):
    if not ODDS_API_KEY:
        logger.warning("OddsAPI key not configured")
        return jsonify({
            'error': 'OddsAPI key not configured',
            'message': 'Please configure a valid OddsAPI key to access odds data',
            'status': 'error'
        }), 401
    
    try:
        regions = request.args.get('regions', 'uk,us,eu')
        markets = request.args.get('markets', 'h2h,spreads,totals')
        date_format = request.args.get('dateFormat', 'iso')
        odds_format = request.args.get('oddsFormat', 'decimal')
        
        logger.info(f"Getting odds for sport: {sport}")
        url = f"{ODDS_API_URL}/v4/sports/{sport}/odds"
        params = {
            'apiKey': ODDS_API_KEY,
            'regions': regions,
            'markets': markets,
            'dateFormat': date_format,
            'oddsFormat': odds_format
        }
        
        logger.info(f"Fetching odds data from URL: {url}")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"OddsAPI responded with status code {response.status_code}")
            error_message = f'OddsAPI responded with status code {response.status_code}'
            
            # Add more context based on common error codes
            if response.status_code == 401:
                error_message = 'OddsAPI key is invalid or expired'
            elif response.status_code == 429:
                error_message = 'OddsAPI rate limit exceeded. Please try again later.'
            
            return jsonify({
                'error': error_message,
                'status': 'error'
            }), response.status_code
        
        odds_data = response.json()
        logger.info(f"Successfully fetched odds data for {sport}")
        matches = convert_to_standardized_matches(odds_data, sport)
        
        # Update requests remaining
        if 'x-requests-remaining' in response.headers:
            STATUS_TRACKER['odds_api']['requests_remaining'] = response.headers['x-requests-remaining']
            logger.info(f"OddsAPI requests remaining: {STATUS_TRACKER['odds_api']['requests_remaining']}")
        
        return jsonify(matches)
    except Exception as e:
        logger.error(f"Error fetching odds data: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'message': 'Failed to connect to OddsAPI. Please check your internet connection and try again.',
            'status': 'error'
        }), 500

def convert_to_standardized_matches(odds_data, sport):
    """Convert odds API data to standardized match objects"""
    standardized_matches = []
    
    for match in odds_data:
        standardized_match = {
            'id': match.get('id', ''),
            'sport_key': match.get('sport_key', ''),
            'sport_title': match.get('sport_title', ''),
            'commence_time': match.get('commence_time', ''),
            'home_team': match.get('home_team', ''),
            'away_team': match.get('away_team', ''),
            'bookmakers': []
        }
        
        for bookmaker in match.get('bookmakers', []):
            standardized_bookmaker = {
                'key': bookmaker.get('key', ''),
                'title': bookmaker.get('title', ''),
                'markets': []
            }
            
            for market in bookmaker.get('markets', []):
                standardized_market = {
                    'key': market.get('key', ''),
                    'outcomes': []
                }
                
                for outcome in market.get('outcomes', []):
                    standardized_outcome = {
                        'name': outcome.get('name', ''),
                        'price': outcome.get('price', 0)
                    }
                    standardized_market['outcomes'].append(standardized_outcome)
                
                standardized_bookmaker['markets'].append(standardized_market)
            
            standardized_match['bookmakers'].append(standardized_bookmaker)
        
        standardized_matches.append(standardized_match)
    
    return standardized_matches

# Get live scores (using alternative endpoint in free tier)
@app.route('/api/livescore', methods=['GET'])
def get_livescore():
    try:
        # For free tier, we must use league event endpoints as livescore endpoint isn't available
        # By default, we'll use English Premier League (ID: 4328)
        league_id = request.args.get('league_id', '4328')
        logger.info(f"Getting livescore data for league ID: {league_id}")
        
        # With free tier (API key "3"), we can't access livescore.php directly
        # We'll combine both past and upcoming matches to simulate a livescore feed
        past_url = f"{SPORTS_DB_API_URL}/eventspastleague.php?id={league_id}"
        upcoming_url = f"{SPORTS_DB_API_URL}/eventsnextleague.php?id={league_id}"
        
        logger.info(f"Fetching past events from URL: {past_url}")
        past_response = requests.get(past_url, timeout=10)
        
        logger.info(f"Fetching upcoming events from URL: {upcoming_url}")
        upcoming_response = requests.get(upcoming_url, timeout=10)
        
        # Check if both requests were successful
        if past_response.status_code != 200 and upcoming_response.status_code != 200:
            logger.warning(f"Both API requests failed with status codes {past_response.status_code} and {upcoming_response.status_code}")
            return jsonify({'error': 'Failed to fetch event data'}), 500
        
        # Initialize the combined data structure
        livescore_data = {
            'events': [],
            'note': ''  # Initialize note as empty string
        }
        
        # Add past events if available
        if past_response.status_code == 200:
            past_data = past_response.json()
            if 'events' in past_data and past_data['events']:
                logger.info(f"Adding {len(past_data['events'])} past events")
                livescore_data['events'].extend(past_data['events'])
        
        # Add upcoming events if available
        if upcoming_response.status_code == 200:
            upcoming_data = upcoming_response.json()
            if 'events' in upcoming_data and upcoming_data['events']:
                logger.info(f"Adding {len(upcoming_data['events'])} upcoming events")
                livescore_data['events'].extend(upcoming_data['events'])
        
        # Add a note about using free tier data
        if livescore_data['events']:
            livescore_data['note'] = "Using past/upcoming events data from free API tier. For real-time scores, upgrade to premium."
        else:
            # If we have no events at all, add a clear message
            livescore_data['note'] = "No events data available for this league."
            
        return jsonify(livescore_data)
    except Exception as e:
        logger.error(f"Error fetching livescore data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get fixtures for a league
@app.route('/api/fixtures/league/<league_id>', methods=['GET'])
def get_league_fixtures(league_id):
    try:
        logger.info(f"Getting fixtures for league ID: {league_id}")
        
        # Free tier endpoint is already correctly formatted with API key "3" in the URL
        url = f"{SPORTS_DB_API_URL}/eventsnextleague.php?id={league_id}"
        
        # The free tier API key "3" is already included in SPORTS_DB_API_URL
        # Don't add the premium key as a parameter with the free tier URL
        
        logger.info(f"Fetching fixtures data from URL: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"API responded with status code {response.status_code}")
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        fixtures_data = response.json()
        return jsonify(fixtures_data)
    except Exception as e:
        logger.error(f"Error fetching fixtures data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get teams in a league
@app.route('/api/teams/league/<league_id>', methods=['GET'])
def get_teams(league_id):
    try:
        logger.info(f"Getting teams for league ID: {league_id}")
        
        # Free tier endpoint is already correctly formatted with API key "3" in the URL
        url = f"{SPORTS_DB_API_URL}/lookup_all_teams.php?id={league_id}"
        
        # The free tier API key "3" is already included in SPORTS_DB_API_URL
        # Don't add the premium key as a parameter with the free tier URL
        
        logger.info(f"Fetching teams data from URL: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"API responded with status code {response.status_code}")
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        teams_data = response.json()
        return jsonify(teams_data)
    except Exception as e:
        logger.error(f"Error fetching teams data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get all leagues
@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    try:
        logger.info("Getting all leagues")
        
        # Free tier endpoint is already correctly formatted with API key "3" in the URL
        url = f"{SPORTS_DB_API_URL}/all_leagues.php"
        
        # The free tier API key "3" is already included in SPORTS_DB_API_URL
        # Don't add the premium key as a parameter with the free tier URL
        
        logger.info(f"Fetching leagues data from URL: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"API responded with status code {response.status_code}")
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        leagues_data = response.json()
        return jsonify(leagues_data)
    except Exception as e:
        logger.error(f"Error fetching leagues data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5000))
    logger.info(f"Starting PuntaIQ API Service on port {port}")
    try:
        app.run(host='0.0.0.0', port=port, threaded=True)
    except OSError as e:
        if "Address already in use" in str(e):
            # Try to find another port
            for alt_port in range(port + 1, port + 10):
                logger.info(f"Port {port} is in use, trying port {alt_port}")
                try:
                    app.run(host='0.0.0.0', port=alt_port, threaded=True)
                    break
                except OSError:
                    continue
            else:
                logger.error(f"Could not find an available port, exiting")
                sys.exit(1)
        else:
            logger.error(f"Error starting server: {e}")
            raise