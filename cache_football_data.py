"""
Football data cache updater for PuntaIQ
Fetches and caches football data from API-Football
"""
import os
import json
import time
import datetime
import requests

# ==========================================================================
# Configuration
# ==========================================================================
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY')
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"

# Configure logging
LOG_FILE = "football_cache_log.txt"

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

# ==========================================================================
# Data Caching Functions
# ==========================================================================
def cache_football_fixtures():
    """Cache football fixtures for upcoming dates."""
    dates = get_date_range(3)  # Next 3 days
    
    for date in dates:
        data = fetch_football_fixtures(date=date)
        if data:
            # Cache to local file
            cache_dir = "cache/football/fixtures"
            os.makedirs(cache_dir, exist_ok=True)
            with open(f"{cache_dir}/{date}.json", "w") as f:
                json.dump(data, f)
            log_message(f"Cached {len(data.get('response', []))} football fixtures to local file for {date}")
        
        # Rate limiting to avoid API restrictions
        time.sleep(1)

# ==========================================================================
# Main Function
# ==========================================================================
def run_football_cache_update():
    """Run the football cache update process."""
    start_time = datetime.datetime.now()
    log_message(f"Starting football cache update at {start_time}")
    
    # Create cache directory structure
    os.makedirs("cache/football/fixtures", exist_ok=True)
    
    try:
        cache_football_fixtures()
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Football cache update completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during football cache update: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_football_cache_update()