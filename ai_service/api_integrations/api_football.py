"""
API-Football Integration Module
Handles interactions with the API-Football service for fetching match data, 
team information, leagues, and other football-related data.
"""

import requests
import os
import json
import time
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api_football')

# API Configuration
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY")
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"

# Headers for API requests
headers = {
    "x-apisports-key": API_FOOTBALL_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io"
}

# Cache settings
CACHE_DURATION = 3600  # 1 hour in seconds
cache = {}

def _get_cached_data(cache_key):
    """Retrieve data from cache if valid"""
    if cache_key in cache:
        data, timestamp = cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            logger.info(f"Retrieved {cache_key} from cache")
            return data
    return None

def _save_to_cache(cache_key, data):
    """Save data to cache with current timestamp"""
    cache[cache_key] = (data, time.time())
    logger.info(f"Saved {cache_key} to cache")

def _make_api_request(endpoint, params=None):
    """
    Make a request to the API-Football service
    
    Args:
        endpoint (str): API endpoint to call
        params (dict, optional): Query parameters for the request
        
    Returns:
        dict: API response as JSON
    """
    if not API_FOOTBALL_KEY:
        logger.error("API_FOOTBALL_KEY environment variable not set!")
        return {"errors": {"token": "API key not configured"}}
    
    url = f"{API_FOOTBALL_BASE_URL}/{endpoint}"
    
    # Create cache key from endpoint and params
    cache_key = f"{endpoint}:{json.dumps(params) if params else ''}"
    
    # Check cache first
    cached_data = _get_cached_data(cache_key)
    if cached_data:
        return cached_data
    
    try:
        logger.info(f"Making API request to {endpoint}")
        response = requests.get(url, headers=headers, params=params)
        
        # API-Football returns HTTP 200 even for errors, check response structure
        data = response.json()
        
        if response.status_code != 200:
            logger.error(f"API request failed: HTTP {response.status_code}, {data}")
            return {"errors": {"status": response.status_code, "message": str(data)}}
            
        if "errors" in data and data["errors"]:
            logger.error(f"API errors: {data['errors']}")
            return data
        
        # If successful, cache the result
        _save_to_cache(cache_key, data)
        logger.info(f"API request successful: {len(data.get('response', []))} items")
        return data
        
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return {"errors": {"request": str(e)}}
    except json.JSONDecodeError:
        logger.error("Failed to decode API response as JSON")
        return {"errors": {"json": "Invalid response format"}}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"errors": {"unknown": str(e)}}

def fetch_fixtures(date=None, league_id=None, team_id=None, season=None, status=None):
    """
    Fetch fixtures for a specific date, league, team, or season
    
    Args:
        date (str, optional): Date in YYYY-MM-DD format
        league_id (int, optional): League ID
        team_id (int, optional): Team ID
        season (int, optional): Season year (e.g., 2024)
        status (str, optional): Match status (e.g., 'NS' for not started)
        
    Returns:
        dict: Fixtures data
    """
    params = {}
    
    if date:
        params["date"] = date
    if league_id:
        params["league"] = league_id
    if team_id:
        params["team"] = team_id
    if season:
        params["season"] = season
    if status:
        params["status"] = status
        
    return _make_api_request("fixtures", params)

def fetch_live_fixtures():
    """
    Fetch all live football fixtures
    
    Returns:
        dict: Live fixtures data
    """
    params = {"live": "all"}
    return _make_api_request("fixtures", params)

def fetch_fixtures_by_date_range(start_date, end_date, league_id=None):
    """
    Fetch fixtures within a date range for a specific league
    
    Args:
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        league_id (int, optional): League ID
        
    Returns:
        dict: Fixtures in the specified date range
    """
    params = {
        "from": start_date,
        "to": end_date
    }
    
    if league_id:
        params["league"] = league_id
        
    return _make_api_request("fixtures", params)

def fetch_fixture_by_id(fixture_id):
    """
    Fetch details for a specific fixture by ID
    
    Args:
        fixture_id (int): The fixture ID
        
    Returns:
        dict: Fixture details
    """
    params = {"id": fixture_id}
    return _make_api_request("fixtures", params)

def fetch_teams(league_id, season):
    """
    Fetch teams for a specific league and season
    
    Args:
        league_id (int): League ID
        season (int): Season year (e.g., 2024)
        
    Returns:
        dict: Teams data
    """
    params = {
        "league": league_id,
        "season": season
    }
    return _make_api_request("teams", params)

def fetch_team_by_id(team_id):
    """
    Fetch details for a specific team by ID
    
    Args:
        team_id (int): Team ID
        
    Returns:
        dict: Team details
    """
    params = {"id": team_id}
    return _make_api_request("teams", params)

def fetch_leagues(country=None, season=None, current=True):
    """
    Fetch available leagues
    
    Args:
        country (str, optional): Country name
        season (int, optional): Season year
        current (bool, optional): Only current leagues if True
        
    Returns:
        dict: Leagues data
    """
    params = {}
    
    if country:
        params["country"] = country
    if season:
        params["season"] = season
    if current:
        params["current"] = "true"
        
    return _make_api_request("leagues", params)

def fetch_standings(league_id, season):
    """
    Fetch current standings for a league
    
    Args:
        league_id (int): League ID
        season (int): Season year
        
    Returns:
        dict: League standings
    """
    params = {
        "league": league_id,
        "season": season
    }
    return _make_api_request("standings", params)

def fetch_head_to_head(team1_id, team2_id, last=10):
    """
    Fetch head-to-head records between two teams
    
    Args:
        team1_id (int): First team ID
        team2_id (int): Second team ID
        last (int): Number of most recent matches to include
        
    Returns:
        dict: Head-to-head fixtures data
    """
    params = {
        "h2h": f"{team1_id}-{team2_id}",
        "last": last
    }
    return _make_api_request("fixtures/headtohead", params)

def fetch_player_statistics(player_id, season, league_id=None):
    """
    Fetch statistics for a specific player
    
    Args:
        player_id (int): Player ID
        season (int): Season year
        league_id (int, optional): League ID for specific league stats
        
    Returns:
        dict: Player statistics
    """
    params = {
        "id": player_id,
        "season": season
    }
    
    if league_id:
        params["league"] = league_id
        
    return _make_api_request("players", params)

def fetch_odds(fixture_id, bookmaker_id=None):
    """
    Fetch betting odds for a fixture
    
    Args:
        fixture_id (int): Fixture ID
        bookmaker_id (int, optional): Specific bookmaker ID
        
    Returns:
        dict: Odds data
    """
    params = {"fixture": fixture_id}
    
    if bookmaker_id:
        params["bookmaker"] = bookmaker_id
        
    return _make_api_request("odds", params)

def get_upcoming_matches(league_ids=None, days_ahead=7):
    """
    Get upcoming matches for the next X days
    
    Args:
        league_ids (list, optional): List of league IDs to filter by
        days_ahead (int, optional): Number of days to look ahead
        
    Returns:
        dict: Processed upcoming matches data
    """
    today = datetime.today().strftime("%Y-%m-%d")
    future_date = (datetime.today() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    
    # Standard major leagues if none provided
    if not league_ids:
        league_ids = [39, 140, 61, 78, 135, 2]  # Premier League, La Liga, Ligue 1, Bundesliga, Serie A, Champions League
    
    all_fixtures = []
    
    for league_id in league_ids:
        data = fetch_fixtures_by_date_range(today, future_date, league_id)
        if "response" in data:
            all_fixtures.extend(data["response"])
    
    # Process data into a more usable format
    processed_fixtures = []
    for fixture in all_fixtures:
        processed_fixtures.append({
            "id": fixture.get("fixture", {}).get("id"),
            "date": fixture.get("fixture", {}).get("date"),
            "league": {
                "id": fixture.get("league", {}).get("id"),
                "name": fixture.get("league", {}).get("name"),
                "country": fixture.get("league", {}).get("country")
            },
            "home_team": {
                "id": fixture.get("teams", {}).get("home", {}).get("id"),
                "name": fixture.get("teams", {}).get("home", {}).get("name")
            },
            "away_team": {
                "id": fixture.get("teams", {}).get("away", {}).get("id"),
                "name": fixture.get("teams", {}).get("away", {}).get("name")
            },
            "status": fixture.get("fixture", {}).get("status", {}).get("short")
        })
    
    return {
        "data": processed_fixtures,
        "count": len(processed_fixtures),
        "timestamp": datetime.now().isoformat()
    }

# Simple test function to validate API connection
def test_api_connection():
    """Test the API connection and key validity"""
    response = _make_api_request("status")
    
    if "errors" in response and response["errors"]:
        logger.error("API connection test failed")
        return False, response["errors"]
    
    logger.info("API connection test successful")
    return True, response

if __name__ == "__main__":
    # This will execute only if the script is run directly
    success, response = test_api_connection()
    print(f"API Connection Test: {'Success' if success else 'Failed'}")
    print(json.dumps(response, indent=2))