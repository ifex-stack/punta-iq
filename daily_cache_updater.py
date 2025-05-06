"""
Daily cache updater for PuntaIQ sports prediction platform
This script is designed to be run daily via Replit Scheduler
"""
import os
import sys
import json
import time
import datetime
import requests
import firebase_admin
from firebase_admin import credentials, db

# ==========================================================================
# Configuration
# ==========================================================================
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY')
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
FIREBASE_DB_URL = os.environ.get('FIREBASE_DB_URL')

# API endpoints
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
BALLDONTLIE_BASE_URL = "https://www.balldontlie.io/api/v1"
THESPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"  # Free tier
ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"

# Configure logging
LOG_FILE = "cache_update_log.txt"

# ==========================================================================
# Helper Functions
# ==========================================================================
def log_message(message, level="INFO"):
    """Log a message with timestamp to console and log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] [{level}] {message}"
    print(log_entry)
    
    # Append to log file
    with open(LOG_FILE, "a") as f:
        f.write(log_entry + "\n")

def get_date_range(days=7):
    """Get a range of dates from today to X days in the future."""
    dates = []
    for i in range(days):
        date = datetime.date.today() + datetime.timedelta(days=i)
        dates.append(date.strftime("%Y-%m-%d"))
    return dates

# ==========================================================================
# Firebase Setup
# ==========================================================================
def initialize_firebase():
    """Initialize Firebase connection."""
    try:
        service_account_path = "firebase-service-account.json"
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_app = firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DB_URL
            })
            log_message("Firebase initialized successfully.")
            return firebase_app
        else:
            log_message(f"Firebase credentials file not found at {service_account_path}", "ERROR")
            return None
    except Exception as e:
        log_message(f"Error initializing Firebase: {str(e)}", "ERROR")
        return None

# ==========================================================================
# API Data Fetching Functions
# ==========================================================================
def fetch_football_fixtures(date=None):
    """Fetch football fixtures from API-Football."""
    if not API_FOOTBALL_KEY:
        log_message("API_FOOTBALL_KEY not set. Skipping football fixtures.", "WARNING")
        return None
        
    try:
        url = f"{API_FOOTBALL_BASE_URL}/fixtures"
        headers = {"x-apisports-key": API_FOOTBALL_KEY}
        params = {}
        
        if date:
            params["date"] = date
            
        log_message(f"Fetching football fixtures for date: {date}")
        response = requests.get(url, headers=headers, params=params)
        
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
        
        log_message(f"Fetching NBA games for date: {date}")
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching NBA games: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching NBA games: {str(e)}", "ERROR")
        return None

def fetch_sports_events(sport, date=None):
    """Fetch events from TheSportsDB."""
    try:
        url = f"{THESPORTSDB_BASE_URL}/eventsday.php"
        params = {}
        
        if date:
            params["d"] = date
        
        params["s"] = sport
        
        log_message(f"Fetching {sport} events for date: {date}")
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching {sport} events: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching {sport} events: {str(e)}", "ERROR")
        return None

def fetch_odds(sport):
    """Fetch odds from The Odds API."""
    if not ODDS_API_KEY:
        log_message("ODDS_API_KEY not set. Skipping odds data.", "WARNING")
        return None
        
    try:
        url = f"{ODDS_API_BASE_URL}/sports/{sport}/odds"
        headers = {"x-api-key": ODDS_API_KEY}
        params = {
            "regions": "uk",
            "oddsFormat": "decimal",
            "dateFormat": "iso"
        }
        
        log_message(f"Fetching odds for {sport}")
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            log_message(f"Error fetching odds for {sport}: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_message(f"Exception fetching odds for {sport}: {str(e)}", "ERROR")
        return None

# ==========================================================================
# Data Caching Functions
# ==========================================================================
def cache_football_fixtures():
    """Cache football fixtures for upcoming dates."""
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_football_fixtures(date=date)
        if data:
            # If Firebase is available, cache there
            try:
                fixtures_ref = db.reference(f"/cache/football/fixtures/{date}")
                fixtures_ref.set(data)
                log_message(f"Cached {len(data.get('response', []))} football fixtures to Firebase for {date}")
            except Exception as e:
                log_message(f"Error caching to Firebase: {str(e)}", "ERROR")
                
            # Also cache to local file as backup
            cache_dir = "cache/football/fixtures"
            os.makedirs(cache_dir, exist_ok=True)
            with open(f"{cache_dir}/{date}.json", "w") as f:
                json.dump(data, f)
            log_message(f"Cached {len(data.get('response', []))} football fixtures to local file for {date}")
        
        # Rate limiting to avoid API restrictions
        time.sleep(1)

def cache_nba_games():
    """Cache NBA games for upcoming dates."""
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_nba_games(date=date)
        if data:
            # If Firebase is available, cache there
            try:
                games_ref = db.reference(f"/cache/basketball/nba/games/{date}")
                games_ref.set(data)
                log_message(f"Cached {len(data.get('data', []))} NBA games to Firebase for {date}")
            except Exception as e:
                log_message(f"Error caching to Firebase: {str(e)}", "ERROR")
                
            # Also cache to local file as backup
            cache_dir = "cache/basketball/nba/games"
            os.makedirs(cache_dir, exist_ok=True)
            with open(f"{cache_dir}/{date}.json", "w") as f:
                json.dump(data, f)
            log_message(f"Cached {len(data.get('data', []))} NBA games to local file for {date}")
        
        # Rate limiting
        time.sleep(1)

def cache_other_sports():
    """Cache other sports events for upcoming dates."""
    sports = ["Tennis", "American Football", "Ice Hockey", "Golf"]
    dates = get_date_range(3)  # Next 3 days
    
    for sport in sports:
        sport_key = sport.lower().replace(" ", "_")
        
        for date in dates:
            data = fetch_sports_events(sport, date=date)
            if data:
                # If Firebase is available, cache there
                try:
                    events_ref = db.reference(f"/cache/{sport_key}/events/{date}")
                    events_ref.set(data)
                    events_count = len(data.get('events', []) or [])
                    log_message(f"Cached {events_count} {sport} events to Firebase for {date}")
                except Exception as e:
                    log_message(f"Error caching to Firebase: {str(e)}", "ERROR")
                
                # Also cache to local file as backup
                cache_dir = f"cache/{sport_key}/events"
                os.makedirs(cache_dir, exist_ok=True)
                with open(f"{cache_dir}/{date}.json", "w") as f:
                    json.dump(data, f)
                events_count = len(data.get('events', []) or [])
                log_message(f"Cached {events_count} {sport} events to local file for {date}")
            
            # Rate limiting
            time.sleep(1)

def cache_odds():
    """Cache odds data for various sports."""
    sports = ["soccer", "basketball", "americanfootball_nfl", "tennis", "icehockey_nhl"]
    
    for sport in sports:
        data = fetch_odds(sport)
        if data:
            sport_key = sport.split("_")[0] if "_" in sport else sport
            
            # If Firebase is available, cache there
            try:
                odds_ref = db.reference(f"/cache/{sport_key}/odds")
                odds_ref.set(data)
                log_message(f"Cached odds to Firebase for {sport}")
            except Exception as e:
                log_message(f"Error caching to Firebase: {str(e)}", "ERROR")
            
            # Also cache to local file as backup
            cache_dir = f"cache/{sport_key}/odds"
            os.makedirs(cache_dir, exist_ok=True)
            with open(f"{cache_dir}/latest.json", "w") as f:
                json.dump(data, f)
            log_message(f"Cached odds to local file for {sport}")
        
        # Rate limiting to avoid API restrictions
        time.sleep(1)

# ==========================================================================
# Main Function
# ==========================================================================
def run_daily_cache_update():
    """Run the daily cache update process."""
    start_time = datetime.datetime.now()
    log_message(f"Starting daily cache update at {start_time}")
    
    # Initialize Firebase
    firebase_app = initialize_firebase()
    if not firebase_app:
        log_message("Firebase initialization failed, but continuing with local caching.", "WARNING")
    
    # Create cache directory if it doesn't exist
    os.makedirs("cache", exist_ok=True)
    
    try:
        # Cache data from different sports APIs
        cache_football_fixtures()
        cache_nba_games()
        cache_other_sports()
        cache_odds()
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Daily cache update completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during daily cache update: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_daily_cache_update()