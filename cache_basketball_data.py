"""
Basketball data cache updater for PuntaIQ
Fetches and caches NBA games from BallDontLie API
"""
import os
import json
import time
import datetime
import requests

# ==========================================================================
# Configuration
# ==========================================================================
BALLDONTLIE_BASE_URL = "https://www.balldontlie.io/api/v1"

# Configure logging
LOG_FILE = "basketball_cache_log.txt"

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
# API Data Fetching Functions
# ==========================================================================
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

# ==========================================================================
# Data Caching Functions
# ==========================================================================
def cache_nba_games():
    """Cache NBA games for upcoming dates."""
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_nba_games(date=date)
        if data:
            # Cache to local file
            cache_dir = "cache/basketball/nba/games"
            os.makedirs(cache_dir, exist_ok=True)
            with open(f"{cache_dir}/{date}.json", "w") as f:
                json.dump(data, f)
            log_message(f"Cached {len(data.get('data', []))} NBA games to local file for {date}")
        
        # Rate limiting
        time.sleep(1)

# ==========================================================================
# Main Function
# ==========================================================================
def run_basketball_cache_update():
    """Run the basketball cache update process."""
    start_time = datetime.datetime.now()
    log_message(f"Starting basketball cache update at {start_time}")
    
    # Create cache directory structure
    os.makedirs("cache/basketball/nba/games", exist_ok=True)
    
    try:
        cache_nba_games()
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Basketball cache update completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during basketball cache update: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_basketball_cache_update()