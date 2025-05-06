"""
TheSportsDB Integration Module
Handles interactions with TheSportsDB API for fetching sports data,
including upcoming events, team information, player details, and more.
This API offers free access to sports data with some limitations.
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
logger = logging.getLogger('thesportsdb')

# API Configuration
# TheSportsDB offers a free tier with API key "1" (limited data)
# For premium access, use your key from https://www.thesportsdb.com/api.php
THESPORTSDB_API_KEY = os.getenv("THESPORTSDB_API_KEY", "1")  # Default to free tier
THESPORTSDB_BASE_URL = f"https://www.thesportsdb.com/api/v1/json/{THESPORTSDB_API_KEY}"

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
    Make a request to TheSportsDB API
    
    Args:
        endpoint (str): API endpoint to call
        params (dict, optional): Query parameters for the request
        
    Returns:
        dict: API response as JSON
    """
    url = f"{THESPORTSDB_BASE_URL}/{endpoint}"
    
    # Create cache key from endpoint and params
    cache_key = f"{endpoint}:{json.dumps(params) if params else ''}"
    
    # Check cache first
    cached_data = _get_cached_data(cache_key)
    if cached_data:
        return cached_data
    
    try:
        logger.info(f"Making API request to {endpoint}")
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            logger.error(f"API request failed: HTTP {response.status_code}")
            return {"error": f"HTTP {response.status_code}"}
        
        data = response.json()
        
        # If successful, cache the result
        _save_to_cache(cache_key, data)
        logger.info(f"API request successful")
        return data
        
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return {"error": f"Request failed: {str(e)}"}
    except json.JSONDecodeError:
        logger.error("Failed to decode API response as JSON")
        return {"error": "Invalid response format"}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}

# === League functions ===

def fetch_all_leagues():
    """
    Fetch all available leagues
    
    Returns:
        dict: All leagues data
    """
    return _make_api_request("all_leagues.php")

def fetch_leagues_by_sport(sport):
    """
    Fetch leagues for a specific sport
    
    Args:
        sport (str): Sport name (e.g., 'Soccer')
        
    Returns:
        dict: Leagues data for the specified sport
    """
    return _make_api_request("search_all_leagues.php", {"s": sport})

def fetch_league_details(league_id):
    """
    Fetch detailed information about a specific league
    
    Args:
        league_id (str): League ID
        
    Returns:
        dict: League details
    """
    return _make_api_request("lookupleague.php", {"id": league_id})

# === Event functions ===

def fetch_upcoming_events(league_id, days=15):
    """
    Fetch upcoming events for a specific league
    
    Args:
        league_id (str): League ID
        days (int, optional): Number of days to look ahead (max 15 for free tier)
        
    Returns:
        dict: Upcoming events data
    """
    # Make sure days is within bounds for free tier
    days = min(days, 15)
    return _make_api_request("eventsnextleague.php", {"id": league_id, "d": days})

def fetch_last_events(league_id, days=15):
    """
    Fetch recent past events for a specific league
    
    Args:
        league_id (str): League ID
        days (int, optional): Number of past days to include (max 15 for free tier)
        
    Returns:
        dict: Past events data
    """
    # Make sure days is within bounds for free tier
    days = min(days, 15)
    return _make_api_request("eventspastleague.php", {"id": league_id, "d": days})

def fetch_event_details(event_id):
    """
    Fetch detailed information about a specific event
    
    Args:
        event_id (str): Event ID
        
    Returns:
        dict: Event details
    """
    return _make_api_request("lookupevent.php", {"id": event_id})

def fetch_live_scores():
    """
    Fetch current live scores (requires premium API key)
    
    Returns:
        dict: Live scores data
    """
    if THESPORTSDB_API_KEY == "1":
        logger.warning("Live scores requires premium API key")
        return {"error": "Live scores requires premium API key"}
    
    return _make_api_request("livescore.php")

# === Team functions ===

def fetch_teams_by_league(league_id):
    """
    Fetch all teams for a specific league
    
    Args:
        league_id (str): League ID
        
    Returns:
        dict: Teams data
    """
    return _make_api_request("lookup_all_teams.php", {"id": league_id})

def fetch_teams_by_sport_and_country(sport, country):
    """
    Fetch teams by sport and country
    
    Args:
        sport (str): Sport name (e.g., 'Soccer')
        country (str): Country name (e.g., 'England')
        
    Returns:
        dict: Teams data
    """
    return _make_api_request("search_all_teams.php", {"s": sport, "c": country})

def fetch_team_details(team_id):
    """
    Fetch detailed information about a specific team
    
    Args:
        team_id (str): Team ID
        
    Returns:
        dict: Team details
    """
    return _make_api_request("lookupteam.php", {"id": team_id})

def search_teams(team_name):
    """
    Search for teams by name
    
    Args:
        team_name (str): Team name to search for
        
    Returns:
        dict: Search results
    """
    return _make_api_request("searchteams.php", {"t": team_name})

# === Player functions ===

def fetch_players_by_team(team_id):
    """
    Fetch all players for a specific team
    
    Args:
        team_id (str): Team ID
        
    Returns:
        dict: Players data
    """
    return _make_api_request("lookup_all_players.php", {"id": team_id})

def fetch_player_details(player_id):
    """
    Fetch detailed information about a specific player
    
    Args:
        player_id (str): Player ID
        
    Returns:
        dict: Player details
    """
    return _make_api_request("lookupplayer.php", {"id": player_id})

def search_players(player_name):
    """
    Search for players by name
    
    Args:
        player_name (str): Player name to search for
        
    Returns:
        dict: Search results
    """
    return _make_api_request("searchplayers.php", {"p": player_name})

# === Sport data functions ===

def list_all_sports():
    """
    List all available sports
    
    Returns:
        dict: All sports data
    """
    return _make_api_request("all_sports.php")

def fetch_sport_details(sport):
    """
    Fetch details about a specific sport
    
    Args:
        sport (str): Sport name (e.g., 'Soccer')
        
    Returns:
        dict: Sport details
    """
    return _make_api_request("search_all_sports.php", {"s": sport})

# === Utility functions ===

def get_upcoming_events_by_sport(sport, days=7):
    """
    Get upcoming events for a specified sport across major leagues
    
    Args:
        sport (str): Sport name (e.g., 'Soccer', 'Basketball')
        days (int, optional): Number of days to look ahead
        
    Returns:
        dict: Processed upcoming events data
    """
    leagues_data = fetch_leagues_by_sport(sport)
    
    # Handle leagues_data properly based on response structure
    if isinstance(leagues_data, dict) and "leagues" in leagues_data:
        leagues = leagues_data["leagues"]
    else:
        leagues = []
        logger.warning(f"Unexpected response format from fetch_leagues_by_sport for {sport}")
    
    if not leagues:
        return {
            "data": [],
            "count": 0,
            "timestamp": datetime.now().isoformat()
        }
    
    # For simplicity, limit to the first 5 leagues (can be adjusted)
    league_sample = leagues[:5]
    all_events = []
    
    for league in league_sample:
        # Handle potential string vs dict issues
        if isinstance(league, dict) and "idLeague" in league:
            league_id = league["idLeague"]
        else:
            continue
        
        if league_id:
            events_data = fetch_upcoming_events(league_id, days)
            
            # Handle events_data properly based on response structure
            if isinstance(events_data, dict) and "events" in events_data:
                events = events_data["events"]
                if events:
                    all_events.extend(events)
    
    # Process into standardized format
    processed_events = []
    for event in all_events:
        # Make sure we're working with a dict
        if not isinstance(event, dict):
            continue
            
        # Extract values safely
        event_data = {
            "id": event.get("idEvent") if isinstance(event, dict) else None,
            "name": event.get("strEvent") if isinstance(event, dict) else None,
            "date": event.get("dateEvent") if isinstance(event, dict) else None,
            "time": event.get("strTime") if isinstance(event, dict) else None,
            "league": {
                "id": event.get("idLeague") if isinstance(event, dict) else None,
                "name": event.get("strLeague") if isinstance(event, dict) else None
            },
            "home_team": {
                "id": event.get("idHomeTeam") if isinstance(event, dict) else None,
                "name": event.get("strHomeTeam") if isinstance(event, dict) else None
            },
            "away_team": {
                "id": event.get("idAwayTeam") if isinstance(event, dict) else None,
                "name": event.get("strAwayTeam") if isinstance(event, dict) else None
            },
            "stadium": event.get("strVenue") if isinstance(event, dict) else None,
            "sport": sport
        }
        processed_events.append(event_data)
    
    return {
        "data": processed_events,
        "count": len(processed_events),
        "timestamp": datetime.now().isoformat()
    }

# Simple test function to validate API connection
def test_api_connection():
    """Test the API connection"""
    response = _make_api_request("all_sports.php")
    
    if "error" in response:
        logger.error("API connection test failed")
        return False, response
    
    logger.info("API connection test successful")
    return True, response

if __name__ == "__main__":
    # This will execute only if the script is run directly
    success, response = test_api_connection()
    print(f"API Connection Test: {'Success' if success else 'Failed'}")
    
    # Display sample sport data
    sports_data = list_all_sports()
    sports = sports_data.get("sports", [])
    if sports:
        print("\nAvailable Sports:")
        for sport in sports[:5]:  # Show first 5 sports
            print(f"- {sport.get('strSport')}")