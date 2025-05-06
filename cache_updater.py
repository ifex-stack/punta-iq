"""
Sports data cache updater for PuntaIQ
Fetches data from sports APIs and updates the Firebase database
"""
import os
import sys
import json
import time
import requests
import datetime
from firebase_init import get_db_reference, app

# Logger setup
def log_message(message, level="INFO"):
    """Log a message with timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

# Check if Firebase is initialized
if not app:
    log_message("Firebase initialization failed. Exiting.", "ERROR")
    sys.exit(1)

# API configurations
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY')
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')

# API endpoints
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
BALLDONTLIE_BASE_URL = "https://www.balldontlie.io/api/v1"
THESPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3" # Free tier
ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"

# API request headers
def get_football_headers():
    return {
        "x-apisports-key": API_FOOTBALL_KEY
    }

def get_odds_api_headers():
    return {
        "x-api-key": ODDS_API_KEY
    }

# Date utilities
def get_today_date():
    """Get today's date in YYYY-MM-DD format."""
    return datetime.date.today().strftime("%Y-%m-%d")

def get_tomorrow_date():
    """Get tomorrow's date in YYYY-MM-DD format."""
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    return tomorrow.strftime("%Y-%m-%d")

def get_date_range(days=7):
    """Get a range of dates from today to X days in the future."""
    dates = []
    for i in range(days):
        date = datetime.date.today() + datetime.timedelta(days=i)
        dates.append(date.strftime("%Y-%m-%d"))
    return dates

# API data fetching functions
def fetch_football_fixtures(date=None, league_id=None, season=None):
    """Fetch football fixtures from API-Football."""
    if not API_FOOTBALL_KEY:
        log_message("API_FOOTBALL_KEY not set. Skipping football fixtures.", "WARNING")
        return None
        
    try:
        url = f"{API_FOOTBALL_BASE_URL}/fixtures"
        params = {}
        
        if date:
            params["date"] = date
        
        if league_id:
            params["league"] = league_id
            
        if season:
            params["season"] = season
        
        response = requests.get(url, headers=get_football_headers(), params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching football fixtures: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching football fixtures: {str(e)}", "ERROR")
        return None

def fetch_nba_games(date=None):
    """Fetch NBA games from BallDontLie API."""
    try:
        url = f"{BALLDONTLIE_BASE_URL}/games"
        params = {}
        
        if date:
            params["start_date"] = date
            params["end_date"] = date
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching NBA games: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching NBA games: {str(e)}", "ERROR")
        return None

def fetch_thesportsdb_events(sport, date=None):
    """Fetch events from TheSportsDB."""
    try:
        url = f"{THESPORTSDB_BASE_URL}/eventsday.php"
        params = {}
        
        if date:
            params["d"] = date
        
        params["s"] = sport
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching {sport} events: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching {sport} events: {str(e)}", "ERROR")
        return None

def fetch_odds(sport, regions="uk"):
    """Fetch odds from The Odds API."""
    if not ODDS_API_KEY:
        log_message("ODDS_API_KEY not set. Skipping odds data.", "WARNING")
        return None
        
    try:
        url = f"{ODDS_API_BASE_URL}/sports/{sport}/odds"
        params = {
            "regions": regions,
            "oddsFormat": "decimal",
            "dateFormat": "iso"
        }
        
        response = requests.get(url, headers=get_odds_api_headers(), params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching odds for {sport}: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching odds for {sport}: {str(e)}", "ERROR")
        return None

# Firebase cache update functions
def update_football_cache():
    """Update football fixtures cache in Firebase."""
    log_message("Updating football fixtures cache...")
    
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_football_fixtures(date=date)
        if data:
            fixtures_ref = get_db_reference(f"/cache/football/fixtures/{date}")
            fixtures_ref.set(data)
            log_message(f"Cached {len(data.get('response', []))} football fixtures for {date}")
        
        # Rate limiting to avoid API restrictions
        time.sleep(1)
    
    return True

def update_nba_cache():
    """Update NBA games cache in Firebase."""
    log_message("Updating NBA games cache...")
    
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_nba_games(date=date)
        if data:
            games_ref = get_db_reference(f"/cache/basketball/nba/games/{date}")
            games_ref.set(data)
            log_message(f"Cached {len(data.get('data', []))} NBA games for {date}")
        
        # Rate limiting
        time.sleep(1)
    
    return True

def update_other_sports_cache():
    """Update other sports events cache in Firebase."""
    log_message("Updating other sports events cache...")
    
    sports = ["Tennis", "American Football", "Ice Hockey", "Golf"]
    dates = get_date_range(3)  # Next 3 days
    
    for sport in sports:
        sport_key = sport.lower().replace(" ", "_")
        
        for date in dates:
            data = fetch_thesportsdb_events(sport, date=date)
            if data:
                events_ref = get_db_reference(f"/cache/{sport_key}/events/{date}")
                events_ref.set(data)
                events_count = len(data.get('events', []) or [])
                log_message(f"Cached {events_count} {sport} events for {date}")
            
            # Rate limiting
            time.sleep(1)
    
    return True

def update_odds_cache():
    """Update odds cache in Firebase."""
    log_message("Updating odds cache...")
    
    sports = ["soccer", "basketball", "americanfootball_nfl", "tennis", "icehockey_nhl"]
    
    for sport in sports:
        data = fetch_odds(sport)
        if data:
            sport_key = sport.split("_")[0] if "_" in sport else sport
            odds_ref = get_db_reference(f"/cache/{sport_key}/odds")
            odds_ref.set(data)
            log_message(f"Cached odds for {sport}")
        
        # Rate limiting to avoid API restrictions
        time.sleep(1)
    
    return True

def run_full_cache_update():
    """Run a full cache update for all sports data."""
    log_message("Starting full cache update...")
    
    try:
        # Update fixtures/games for all sports
        update_football_cache()
        update_nba_cache()
        update_other_sports_cache()
        
        # Update odds for all sports
        update_odds_cache()
        
        log_message("Full cache update completed successfully.")
        return True
        
    except Exception as e:
        log_message(f"Error during full cache update: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_full_cache_update()