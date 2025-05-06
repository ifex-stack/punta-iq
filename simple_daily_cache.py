"""
Simple daily cache updater for PuntaIQ sports prediction platform
This script fetches sports data from APIs and saves it to local cache files
"""
import os
import sys
import json
import time
import datetime
import requests

# ==========================================================================
# Configuration
# ==========================================================================
API_FOOTBALL_KEY = os.environ.get('API_FOOTBALL_KEY')
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')

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
            # Cache to local file
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
            # Cache to local file
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
                # Cache to local file
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
            
            # Cache to local file
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
    
    # Create cache directory if it doesn't exist
    os.makedirs("cache", exist_ok=True)
    
    try:
        # Cache data from different sports APIs
        cache_football_fixtures()
        cache_nba_games()
        cache_other_sports()
        cache_odds()
        
        # Export training data to exports directory
        export_training_data()
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Daily cache update completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during daily cache update: {str(e)}", "ERROR")
        return False

def export_training_data():
    """Export cached data to training datasets."""
    log_message("Exporting data for AI training...")
    
    # Create exports directory
    exports_dir = "exports"
    os.makedirs(exports_dir, exist_ok=True)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Export football fixtures
    try:
        football_rows = []
        football_fixtures_dir = "cache/football/fixtures"
        
        if os.path.exists(football_fixtures_dir):
            for filename in os.listdir(football_fixtures_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(football_fixtures_dir, filename), "r") as f:
                        try:
                            data = json.load(f)
                            date = filename.replace(".json", "")
                            
                            for fixture in data.get('response', []):
                                fixture_info = fixture.get('fixture', {})
                                teams = fixture.get('teams', {})
                                league = fixture.get('league', {})
                                goals = fixture.get('goals', {})
                                score = fixture.get('score', {})
                                
                                # Only include completed matches with scores for training
                                if fixture_info.get('status', {}).get('short') == 'FT':
                                    row = {
                                        'date': fixture_info.get('date'),
                                        'league_id': league.get('id'),
                                        'league_name': league.get('name'),
                                        'country': league.get('country'),
                                        'home_team': teams.get('home', {}).get('name'),
                                        'away_team': teams.get('away', {}).get('name'),
                                        'home_score': goals.get('home'),
                                        'away_score': goals.get('away'),
                                        'halftime_home': score.get('halftime', {}).get('home'),
                                        'halftime_away': score.get('halftime', {}).get('away'),
                                        'home_win': 1 if goals.get('home', 0) > goals.get('away', 0) else 0,
                                        'draw': 1 if goals.get('home', 0) == goals.get('away', 0) else 0,
                                        'away_win': 1 if goals.get('home', 0) < goals.get('away', 0) else 0,
                                        'total_goals': (goals.get('home', 0) or 0) + (goals.get('away', 0) or 0),
                                        'both_scored': 1 if (goals.get('home', 0) > 0 and goals.get('away', 0) > 0) else 0
                                    }
                                    football_rows.append(row)
                        except json.JSONDecodeError:
                            log_message(f"Error parsing {filename}", "ERROR")
            
            # Write to CSV
            if football_rows:
                csv_file = f"{exports_dir}/football_training_data_{timestamp}.csv"
                with open(csv_file, "w") as f:
                    # Write header
                    f.write(",".join(football_rows[0].keys()) + "\n")
                    
                    # Write rows
                    for row in football_rows:
                        f.write(",".join(str(v) for v in row.values()) + "\n")
                
                log_message(f"Exported {len(football_rows)} football fixtures to {csv_file}")
    except Exception as e:
        log_message(f"Error exporting football data: {str(e)}", "ERROR")
    
    # Export basketball games
    try:
        basketball_rows = []
        basketball_games_dir = "cache/basketball/nba/games"
        
        if os.path.exists(basketball_games_dir):
            for filename in os.listdir(basketball_games_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(basketball_games_dir, filename), "r") as f:
                        try:
                            data = json.load(f)
                            date = filename.replace(".json", "")
                            
                            for game in data.get('data', []):
                                # Only include completed games with scores for training
                                if game.get('status') == 'Final':
                                    row = {
                                        'date': game.get('date'),
                                        'season': game.get('season'),
                                        'home_team': game.get('home_team', {}).get('name'),
                                        'away_team': game.get('visitor_team', {}).get('name'),
                                        'home_score': game.get('home_team_score'),
                                        'away_score': game.get('visitor_team_score'),
                                        'home_win': 1 if game.get('home_team_score', 0) > game.get('visitor_team_score', 0) else 0,
                                        'away_win': 1 if game.get('home_team_score', 0) < game.get('visitor_team_score', 0) else 0,
                                        'total_points': (game.get('home_team_score', 0) or 0) + (game.get('visitor_team_score', 0) or 0)
                                    }
                                    basketball_rows.append(row)
                        except json.JSONDecodeError:
                            log_message(f"Error parsing {filename}", "ERROR")
            
            # Write to CSV
            if basketball_rows:
                csv_file = f"{exports_dir}/basketball_training_data_{timestamp}.csv"
                with open(csv_file, "w") as f:
                    # Write header
                    f.write(",".join(basketball_rows[0].keys()) + "\n")
                    
                    # Write rows
                    for row in basketball_rows:
                        f.write(",".join(str(v) for v in row.values()) + "\n")
                
                log_message(f"Exported {len(basketball_rows)} basketball games to {csv_file}")
    except Exception as e:
        log_message(f"Error exporting basketball data: {str(e)}", "ERROR")
    
    # Create a manifest file with export information
    manifest = {
        "timestamp": timestamp,
        "date": datetime.datetime.now().isoformat(),
        "exports": {
            "football_fixtures": len(football_rows) if 'football_rows' in locals() else 0,
            "basketball_games": len(basketball_rows) if 'basketball_rows' in locals() else 0
        }
    }
    
    with open(f"{exports_dir}/manifest_{timestamp}.json", "w") as f:
        json.dump(manifest, f, indent=2)
    
    log_message("Training data export completed")

if __name__ == "__main__":
    run_daily_cache_update()