"""
BallDon'tLie Integration Module
Handles interactions with the BallDon'tLie API for fetching NBA basketball data,
including games, players, teams, stats, and season averages.
This API is free to use with some rate limitations.
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
logger = logging.getLogger('balldontlie')

# API Configuration
BALLDONTLIE_BASE_URL = "https://www.balldontlie.io/api/v1"
# Note: BallDon'tLie has a free tier with rate limits (60 requests per minute)
# API key is optional and can be provided for higher rate limits
BALLDONTLIE_API_KEY = os.getenv("BALLDONTLIE_API_KEY")

# Define headers if API key is available
headers = {}
if BALLDONTLIE_API_KEY:
    headers["Authorization"] = BALLDONTLIE_API_KEY

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
    Make a request to the BallDon'tLie API
    
    Args:
        endpoint (str): API endpoint to call
        params (dict, optional): Query parameters for the request
        
    Returns:
        dict: API response as JSON
    """
    url = f"{BALLDONTLIE_BASE_URL}/{endpoint}"
    
    # Create cache key from endpoint and params
    cache_key = f"{endpoint}:{json.dumps(params) if params else ''}"
    
    # Check cache first
    cached_data = _get_cached_data(cache_key)
    if cached_data:
        return cached_data
    
    try:
        logger.info(f"Making API request to {endpoint}")
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 429:
            logger.error("API rate limit exceeded")
            return {"error": "Rate limit exceeded"}
        
        if response.status_code != 200:
            logger.error(f"API request failed: HTTP {response.status_code}")
            return {"error": f"HTTP {response.status_code}"}
        
        data = response.json()
        
        # If successful, cache the result
        _save_to_cache(cache_key, data)
        
        if "data" in data and isinstance(data["data"], list):
            logger.info(f"API request successful: {len(data['data'])} items")
        else:
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

# === Game functions ===

def fetch_games(season=None, start_date=None, end_date=None, team_ids=None, 
                page=1, per_page=25, postseason=None):
    """
    Fetch NBA games based on various filters
    
    Args:
        season (int, optional): Season year (e.g., 2023)
        start_date (str, optional): Start date in YYYY-MM-DD format
        end_date (str, optional): End date in YYYY-MM-DD format
        team_ids (list, optional): List of team IDs to filter by
        page (int, optional): Page number for pagination
        per_page (int, optional): Number of results per page
        postseason (bool, optional): True for playoff games, False for regular season
        
    Returns:
        dict: Games data
    """
    params = {"page": page, "per_page": per_page}
    
    if season:
        params["seasons[]"] = season
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    if team_ids:
        params["team_ids[]"] = team_ids
    if postseason is not None:
        # BallDontLie API expects 0 or 1 for boolean values
        params["postseason"] = 1 if postseason else 0
        
    return _make_api_request("games", params)

def fetch_games_by_date(date):
    """
    Fetch games for a specific date
    
    Args:
        date (str): Date in YYYY-MM-DD format
        
    Returns:
        dict: Games data for the specified date
    """
    params = {"dates[]": date}
    return _make_api_request("games", params)

def fetch_game_by_id(game_id):
    """
    Fetch details for a specific game
    
    Args:
        game_id (int): Game ID
        
    Returns:
        dict: Game details
    """
    return _make_api_request(f"games/{game_id}")

# === Player functions ===

def fetch_players(search=None, page=1, per_page=25):
    """
    Fetch players with optional search filter
    
    Args:
        search (str, optional): Player name to search for
        page (int, optional): Page number for pagination
        per_page (int, optional): Number of results per page
        
    Returns:
        dict: Players data
    """
    params = {"page": page, "per_page": per_page}
    
    if search:
        params["search"] = search
        
    return _make_api_request("players", params)

def fetch_players_by_team(team_id, page=1, per_page=25):
    """
    Fetch players for a specific team
    
    Args:
        team_id (int): Team ID
        page (int, optional): Page number for pagination
        per_page (int, optional): Number of results per page
        
    Returns:
        dict: Players data for the specified team
    """
    params = {
        "team_ids[]": team_id,
        "page": page,
        "per_page": per_page
    }
    return _make_api_request("players", params)

def fetch_player_by_id(player_id):
    """
    Fetch details for a specific player
    
    Args:
        player_id (int): Player ID
        
    Returns:
        dict: Player details
    """
    return _make_api_request(f"players/{player_id}")

# === Team functions ===

def fetch_teams():
    """
    Fetch all NBA teams
    
    Returns:
        dict: Teams data
    """
    return _make_api_request("teams")

def fetch_team_by_id(team_id):
    """
    Fetch details for a specific team
    
    Args:
        team_id (int): Team ID
        
    Returns:
        dict: Team details
    """
    return _make_api_request(f"teams/{team_id}")

# === Stats functions ===

def fetch_season_averages(season, player_ids):
    """
    Fetch season averages for specific players
    
    Args:
        season (int): Season year (e.g., 2023)
        player_ids (list): List of player IDs
        
    Returns:
        dict: Season averages data
    """
    params = {
        "season": season,
        "player_ids[]": player_ids if isinstance(player_ids, list) else [player_ids]
    }
    return _make_api_request("season_averages", params)

def fetch_player_game_stats(game_id, player_id):
    """
    Fetch stats for a specific player in a specific game
    
    Args:
        game_id (int): Game ID
        player_id (int): Player ID
        
    Returns:
        dict: Player game stats
    """
    params = {
        "game_ids[]": game_id,
        "player_ids[]": player_id
    }
    stats_data = _make_api_request("stats", params)
    
    if "error" in stats_data:
        return stats_data
    
    return stats_data

# === Utility functions ===

def get_upcoming_games(days_ahead=7):
    """
    Get upcoming NBA games for the next X days
    
    Args:
        days_ahead (int, optional): Number of days to look ahead
        
    Returns:
        dict: Processed upcoming games data
    """
    today = datetime.today().strftime("%Y-%m-%d")
    future_date = (datetime.today() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    
    # Get current NBA season
    current_year = datetime.now().year
    season = current_year if datetime.now().month > 7 else current_year - 1
    
    params = {
        "start_date": today,
        "end_date": future_date,
        "seasons[]": season,
        "per_page": 100  # Increase to get more games
    }
    
    games_data = _make_api_request("games", params)
    
    if "error" in games_data:
        return {
            "data": [],
            "count": 0,
            "timestamp": datetime.now().isoformat(),
            "error": games_data["error"]
        }
    
    games = games_data.get("data", [])
    
    # Process data into a more usable format
    processed_games = []
    for game in games:
        home_team = game.get("home_team", {})
        visitor_team = game.get("visitor_team", {})
        
        processed_games.append({
            "id": game.get("id"),
            "date": game.get("date"),
            "status": game.get("status"),
            "period": game.get("period"),
            "time": game.get("time"),
            "home_team": {
                "id": home_team.get("id"),
                "name": home_team.get("name"),
                "city": home_team.get("city"),
                "conference": home_team.get("conference"),
                "abbreviation": home_team.get("abbreviation")
            },
            "away_team": {
                "id": visitor_team.get("id"),
                "name": visitor_team.get("name"),
                "city": visitor_team.get("city"),
                "conference": visitor_team.get("conference"),
                "abbreviation": visitor_team.get("abbreviation")
            },
            "home_score": game.get("home_team_score"),
            "away_score": game.get("visitor_team_score"),
            "season": game.get("season"),
            "postseason": game.get("postseason")
        })
    
    return {
        "data": processed_games,
        "count": len(processed_games),
        "timestamp": datetime.now().isoformat()
    }

def get_player_with_season_stats(player_name, season=None):
    """
    Get player info with their season stats
    
    Args:
        player_name (str): Player name to search for
        season (int, optional): Season year (defaults to current/most recent season)
        
    Returns:
        dict: Player info with season stats
    """
    # Set season to current season if not provided
    if not season:
        current_year = datetime.now().year
        season = current_year if datetime.now().month > 7 else current_year - 1
    
    # Search for player
    players_data = fetch_players(search=player_name)
    
    if "error" in players_data:
        return {
            "data": None,
            "timestamp": datetime.now().isoformat(),
            "error": players_data["error"]
        }
    
    players = players_data.get("data", [])
    
    if not players:
        return {
            "data": None,
            "timestamp": datetime.now().isoformat(),
            "message": "No players found matching the search criteria"
        }
    
    # Get first matching player
    player = players[0]
    player_id = player.get("id")
    
    # Get season averages
    stats_data = fetch_season_averages(season, player_id)
    
    if "error" in stats_data:
        return {
            "data": {
                "player": player,
                "stats": None
            },
            "timestamp": datetime.now().isoformat(),
            "error": stats_data["error"]
        }
    
    stats = stats_data.get("data", [])
    player_stats = stats[0] if stats else None
    
    return {
        "data": {
            "player": player,
            "stats": player_stats
        },
        "timestamp": datetime.now().isoformat()
    }

# Simple test function to validate API connection
def test_api_connection():
    """Test the API connection"""
    response = _make_api_request("teams")
    
    if "error" in response:
        logger.error("API connection test failed")
        return False, response
    
    logger.info("API connection test successful")
    return True, response

if __name__ == "__main__":
    # This will execute only if the script is run directly
    success, response = test_api_connection()
    print(f"API Connection Test: {'Success' if success else 'Failed'}")
    
    # Display some sample data
    if success:
        # Get sample of teams
        teams = response.get("data", [])
        if teams:
            print("\nNBA Teams:")
            for team in teams[:5]:  # Show first 5 teams
                print(f"- {team.get('full_name')} ({team.get('abbreviation')})")