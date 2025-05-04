from flask import Flask, jsonify, request
import requests
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Constants
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
SPORTSDB_API_KEY = os.getenv('SPORTSDB_API_KEY')
FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

# --- OddsAPI Endpoints ---

@app.route('/api/odds/<sport>', methods=['GET'])
def get_odds(sport):
    """
    Get betting odds for a specific sport
    Supported sports: soccer_epl, soccer_spain_la_liga, soccer_germany_bundesliga, etc.
    """
    days = request.args.get('days', 3, type=int)
    region = request.args.get('region', 'uk,eu,us')
    
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    params = {
        'apiKey': ODDS_API_KEY,
        'regions': region,
        'markets': 'h2h,spreads,totals',
        'oddsFormat': 'decimal',
        'dateFormat': 'iso'
    }
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get odds: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        # Filter for matches within the requested days
        data = response.json()
        
        if not data:
            return jsonify({
                'events': [],
                'count': 0,
                'searchParams': {
                    'days': days,
                    'date': 'today',
                    'region': region,
                    'league': sport
                }
            })
        
        # Calculate the cutoff date
        cutoff_date = (datetime.now() + timedelta(days=days)).isoformat()
        
        # Filter events by date
        filtered_events = [
            event for event in data
            if event.get('commence_time', '') < cutoff_date
        ]
        
        return jsonify({
            'events': filtered_events,
            'count': len(filtered_events),
            'searchParams': {
                'days': days,
                'date': 'today',
                'region': region,
                'league': sport
            }
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching odds data'
        }), 500

@app.route('/api/odds/sports', methods=['GET'])
def get_sports():
    """Get all available sports from OddsAPI"""
    url = "https://api.the-odds-api.com/v4/sports"
    params = {'apiKey': ODDS_API_KEY}
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get sports: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        # Categorize sports by group
        sports_data = response.json()
        categories = {}
        
        for sport in sports_data:
            group = sport.get('group', 'Other')
            if group not in categories:
                categories[group] = []
            categories[group].append(sport)
        
        return jsonify({
            'categories': categories,
            'sports': sports_data,
            'count': len(sports_data)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching sports data'
        }), 500

# --- TheSportsDB Endpoints ---

@app.route('/api/livescore', methods=['GET'])
def get_livescore():
    """Get live scores for soccer matches"""
    url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/livescore.php"
    
    try:
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get livescores: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        data = response.json()
        events = data.get('events', [])
        
        return jsonify({
            'events': events,
            'count': len(events)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching livescore data'
        }), 500

@app.route('/api/fixtures/league/<league_id>', methods=['GET'])
def get_league_fixtures(league_id):
    """Get fixtures for a specific league"""
    # Get the next 14 days of fixtures
    url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/eventsnextleague.php"
    params = {'id': league_id}
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get fixtures: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        data = response.json()
        events = data.get('events', [])
        
        return jsonify({
            'events': events,
            'count': len(events),
            'league': league_id
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching fixture data'
        }), 500

@app.route('/api/teams/<league_id>', methods=['GET'])
def get_teams(league_id):
    """Get all teams in a league"""
    url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/lookup_all_teams.php"
    params = {'id': league_id}
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get teams: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        data = response.json()
        teams = data.get('teams', [])
        
        return jsonify({
            'teams': teams,
            'count': len(teams),
            'league': league_id
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching team data'
        }), 500

@app.route('/api/leagues', methods=['GET'])
def get_all_leagues():
    """Get all available leagues"""
    url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/all_leagues.php"
    
    try:
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Failed to get leagues: {response.status_code}",
                'message': response.text
            }), response.status_code
        
        data = response.json()
        leagues = data.get('leagues', [])
        
        # Organize by sport
        leagues_by_sport = {}
        for league in leagues:
            sport = league.get('strSport', 'Other')
            if sport not in leagues_by_sport:
                leagues_by_sport[sport] = []
            leagues_by_sport[sport].append(league)
        
        return jsonify({
            'leagues': leagues,
            'leagues_by_sport': leagues_by_sport,
            'count': len(leagues)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching league data'
        }), 500

# --- Service Status Endpoint ---

@app.route('/api/status', methods=['GET'])
def get_status():
    """Check the status of all services"""
    status = {
        'timestamp': datetime.now().isoformat(),
        'services': {
            'odds_api': {
                'status': 'unknown',
                'message': ''
            },
            'sportsdb_api': {
                'status': 'unknown',
                'message': ''
            }
        }
    }
    
    # Check OddsAPI
    try:
        odds_url = "https://api.the-odds-api.com/v4/sports"
        odds_params = {'apiKey': ODDS_API_KEY}
        odds_response = requests.get(odds_url, params=odds_params)
        
        if odds_response.status_code == 200:
            status['services']['odds_api'] = {
                'status': 'ok',
                'message': 'Service is operational'
            }
        else:
            status['services']['odds_api'] = {
                'status': 'error',
                'message': f"Service returned status code {odds_response.status_code}"
            }
    except Exception as e:
        status['services']['odds_api'] = {
            'status': 'error',
            'message': f"Error connecting to service: {str(e)}"
        }
    
    # Check TheSportsDB
    try:
        sportsdb_url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/all_leagues.php"
        sportsdb_response = requests.get(sportsdb_url)
        
        if sportsdb_response.status_code == 200:
            status['services']['sportsdb_api'] = {
                'status': 'ok',
                'message': 'Service is operational'
            }
        else:
            status['services']['sportsdb_api'] = {
                'status': 'error',
                'message': f"Service returned status code {sportsdb_response.status_code}"
            }
    except Exception as e:
        status['services']['sportsdb_api'] = {
            'status': 'error',
            'message': f"Error connecting to service: {str(e)}"
        }
    
    # Overall status
    if all(service['status'] == 'ok' for service in status['services'].values()):
        status['overall'] = 'ok'
    else:
        status['overall'] = 'degraded'
    
    return jsonify(status)

if __name__ == '__main__':
    # Check for API keys
    if not ODDS_API_KEY:
        print("WARNING: ODDS_API_KEY not set in environment variables")
    if not SPORTSDB_API_KEY:
        print("WARNING: SPORTSDB_API_KEY not set in environment variables")
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True)