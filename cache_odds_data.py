"""
Betting odds cache updater for PuntaIQ
Fetches and caches odds data from The Odds API
"""
import os
import json
import time
import datetime
import requests
# Import our firebase_init module for Firebase access
from firebase_init import get_db_reference

# ==========================================================================
# Configuration
# ==========================================================================
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"

# Configure logging
LOG_FILE = "odds_cache_log.txt"

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

# ==========================================================================
# API Data Fetching Functions
# ==========================================================================
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
def cache_odds():
    """Cache odds data for various sports."""
    sports = ["soccer", "basketball", "americanfootball_nfl", "tennis", "icehockey_nhl"]
    
    for sport in sports:
        data = fetch_odds(sport)
        if data:
            sport_key = sport.split("_")[0] if "_" in sport else sport
            
            # If Firebase is available, cache there
            try:
                odds_ref = get_db_reference(f"/cache/{sport_key}/odds/latest")
                if odds_ref:
                    odds_ref.set(data)
                    log_message(f"Cached odds to Firebase for {sport}")
                else:
                    log_message(f"Unable to get Firebase reference for {sport} odds", "WARNING")
            except Exception as e:
                log_message(f"Error caching odds to Firebase: {str(e)}", "ERROR")
            
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
def run_odds_cache_update():
    """Run the odds cache update process."""
    start_time = datetime.datetime.now()
    log_message(f"Starting odds cache update at {start_time}")
    
    # Check Firebase connection
    if not get_db_reference("/"):
        log_message("Firebase reference could not be obtained. Will continue with local caching.", "WARNING")
    else:
        log_message("Firebase connection is properly initialized")
    
    # Create base cache directory if it doesn't exist
    os.makedirs("cache", exist_ok=True)
    
    try:
        cache_odds()
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Odds cache update completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during odds cache update: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_odds_cache_update()