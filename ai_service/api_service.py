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
SPORTS_DB_API_URL = "https://www.thesportsdb.com/api/v1/json"

# API Keys
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
SPORTS_API_KEY = os.getenv('API_SPORTS_KEY')

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
        # Simple leagues request to check API status
        url = f"{SPORTS_DB_API_URL}/1/all_leagues.php"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            STATUS_TRACKER['sportsdb_api']['status'] = 'ok'
            STATUS_TRACKER['sportsdb_api']['message'] = 'API is operational'
        elif response.status_code == 401 or response.status_code == 403:
            STATUS_TRACKER['sportsdb_api']['status'] = 'error'
            STATUS_TRACKER['sportsdb_api']['message'] = 'API unauthorized'
        elif response.status_code == 429:
            STATUS_TRACKER['sportsdb_api']['status'] = 'degraded'
            STATUS_TRACKER['sportsdb_api']['message'] = 'Rate limited'
        else:
            STATUS_TRACKER['sportsdb_api']['status'] = 'degraded'
            STATUS_TRACKER['sportsdb_api']['message'] = f'API responded with status code {response.status_code}'
    except Exception as e:
        STATUS_TRACKER['sportsdb_api']['status'] = 'error'
        STATUS_TRACKER['sportsdb_api']['message'] = f'Connection error: {str(e)}'
    
    STATUS_TRACKER['sportsdb_api']['last_check'] = datetime.now()

# Get supported sports
@app.route('/api/sports', methods=['GET'])
def get_sports():
    if not ODDS_API_KEY:
        return jsonify({'error': 'API key not configured'}), 401
    
    try:
        url = f"{ODDS_API_URL}/v4/sports?apiKey={ODDS_API_KEY}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        sports_data = response.json()
        
        # Update requests remaining
        if 'x-requests-remaining' in response.headers:
            STATUS_TRACKER['odds_api']['requests_remaining'] = response.headers['x-requests-remaining']
        
        return jsonify(sports_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get odds for a specific sport
@app.route('/api/odds/<sport>', methods=['GET'])
def get_odds(sport):
    if not ODDS_API_KEY:
        return jsonify({'error': 'API key not configured'}), 401
    
    try:
        regions = request.args.get('regions', 'uk,us,eu')
        markets = request.args.get('markets', 'h2h,spreads,totals')
        date_format = request.args.get('dateFormat', 'iso')
        odds_format = request.args.get('oddsFormat', 'decimal')
        
        url = f"{ODDS_API_URL}/v4/sports/{sport}/odds"
        params = {
            'apiKey': ODDS_API_KEY,
            'regions': regions,
            'markets': markets,
            'dateFormat': date_format,
            'oddsFormat': odds_format
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        odds_data = response.json()
        matches = convert_to_standardized_matches(odds_data, sport)
        
        # Update requests remaining
        if 'x-requests-remaining' in response.headers:
            STATUS_TRACKER['odds_api']['requests_remaining'] = response.headers['x-requests-remaining']
        
        return jsonify(matches)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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

# Get live scores
@app.route('/api/livescore', methods=['GET'])
def get_livescore():
    try:
        url = f"{SPORTS_DB_API_URL}/2/livescore.php"
        
        if SPORTS_API_KEY:
            url = f"{url}?key={SPORTS_API_KEY}"
        
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        livescore_data = response.json()
        return jsonify(livescore_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get fixtures for a league
@app.route('/api/fixtures/league/<league_id>', methods=['GET'])
def get_league_fixtures(league_id):
    try:
        url = f"{SPORTS_DB_API_URL}/1/eventsnextleague.php?id={league_id}"
        
        if SPORTS_API_KEY:
            url = f"{url}&key={SPORTS_API_KEY}"
        
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        fixtures_data = response.json()
        return jsonify(fixtures_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get teams in a league
@app.route('/api/teams/league/<league_id>', methods=['GET'])
def get_teams(league_id):
    try:
        url = f"{SPORTS_DB_API_URL}/1/lookup_all_teams.php?id={league_id}"
        
        if SPORTS_API_KEY:
            url = f"{url}&key={SPORTS_API_KEY}"
        
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        teams_data = response.json()
        return jsonify(teams_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all leagues
@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    try:
        url = f"{SPORTS_DB_API_URL}/1/all_leagues.php"
        
        if SPORTS_API_KEY:
            url = f"{url}?key={SPORTS_API_KEY}"
        
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({'error': f'API responded with status code {response.status_code}'}), response.status_code
        
        leagues_data = response.json()
        return jsonify(leagues_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting PuntaIQ API Service")
    app.run(host='0.0.0.0', port=5000)