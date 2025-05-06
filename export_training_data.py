"""
Training data exporter for PuntaIQ
Processes cached sports data and exports to CSV for AI training
"""
import os
import json
import datetime

# Configure logging
LOG_FILE = "training_export_log.txt"

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

def format_export_timestamp():
    """Get a formatted timestamp for file naming."""
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

# ==========================================================================
# Export Functions
# ==========================================================================
def export_football_data():
    """Export football data from cache to CSV."""
    log_message("Exporting football data...")
    timestamp = format_export_timestamp()
    exports_dir = "exports"
    os.makedirs(exports_dir, exist_ok=True)
    
    try:
        football_rows = []
        football_fixtures_dir = "cache/football/fixtures"
        
        if os.path.exists(football_fixtures_dir):
            for filename in os.listdir(football_fixtures_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(football_fixtures_dir, filename), "r") as f:
                        try:
                            data = json.load(f)
                            
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
                        except Exception as e:
                            log_message(f"Error processing {filename}: {str(e)}", "ERROR")
            
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
                return csv_file
    except Exception as e:
        log_message(f"Error exporting football data: {str(e)}", "ERROR")
    
    return None

def export_basketball_data():
    """Export basketball data from cache to CSV."""
    log_message("Exporting basketball data...")
    timestamp = format_export_timestamp()
    exports_dir = "exports"
    os.makedirs(exports_dir, exist_ok=True)
    
    try:
        basketball_rows = []
        basketball_games_dir = "cache/basketball/nba/games"
        
        if os.path.exists(basketball_games_dir):
            for filename in os.listdir(basketball_games_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(basketball_games_dir, filename), "r") as f:
                        try:
                            data = json.load(f)
                            
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
                        except Exception as e:
                            log_message(f"Error processing {filename}: {str(e)}", "ERROR")
            
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
                return csv_file
    except Exception as e:
        log_message(f"Error exporting basketball data: {str(e)}", "ERROR")
    
    return None

def export_odds_data():
    """Export odds data from cache to CSV."""
    log_message("Exporting odds data...")
    timestamp = format_export_timestamp()
    exports_dir = "exports"
    os.makedirs(exports_dir, exist_ok=True)
    
    try:
        odds_rows = []
        sports = ["soccer", "basketball", "americanfootball", "tennis", "icehockey"]
        
        for sport in sports:
            odds_dir = f"cache/{sport}/odds"
            if os.path.exists(odds_dir):
                latest_file = os.path.join(odds_dir, "latest.json")
                if os.path.exists(latest_file):
                    with open(latest_file, "r") as f:
                        try:
                            data = json.load(f)
                            
                            for event in data:
                                commence_time = event.get('commence_time')
                                home_team = event.get('home_team')
                                away_team = event.get('away_team')
                                
                                for bookmaker in event.get('bookmakers', []):
                                    bookmaker_key = bookmaker.get('key')
                                    
                                    for market in bookmaker.get('markets', []):
                                        market_key = market.get('key')
                                        
                                        for outcome in market.get('outcomes', []):
                                            row = {
                                                'sport': sport,
                                                'event_id': event.get('id'),
                                                'commence_time': commence_time,
                                                'home_team': home_team,
                                                'away_team': away_team,
                                                'bookmaker': bookmaker_key,
                                                'market': market_key,
                                                'outcome_name': outcome.get('name'),
                                                'price': outcome.get('price')
                                            }
                                            odds_rows.append(row)
                        except json.JSONDecodeError:
                            log_message(f"Error parsing {latest_file}", "ERROR")
                        except Exception as e:
                            log_message(f"Error processing {latest_file}: {str(e)}", "ERROR")
        
        # Write to CSV
        if odds_rows:
            csv_file = f"{exports_dir}/odds_training_data_{timestamp}.csv"
            with open(csv_file, "w") as f:
                # Write header
                f.write(",".join(odds_rows[0].keys()) + "\n")
                
                # Write rows
                for row in odds_rows:
                    # Convert price to string and handle None values
                    values = []
                    for v in row.values():
                        if v is None:
                            values.append("")
                        else:
                            values.append(str(v))
                    f.write(",".join(values) + "\n")
            
            log_message(f"Exported {len(odds_rows)} odds entries to {csv_file}")
            return csv_file
    except Exception as e:
        log_message(f"Error exporting odds data: {str(e)}", "ERROR")
    
    return None

# ==========================================================================
# Main Function
# ==========================================================================
def run_training_data_export():
    """Export all training datasets."""
    start_time = datetime.datetime.now()
    log_message(f"Starting training data export at {start_time}")
    
    # Create exports directory
    os.makedirs("exports", exist_ok=True)
    
    try:
        # Export different types of data for training
        football_file = export_football_data()
        basketball_file = export_basketball_data()
        odds_file = export_odds_data()
        
        # Create a manifest of exported files
        timestamp = format_export_timestamp()
        manifest = {
            "export_timestamp": datetime.datetime.now().isoformat(),
            "files": {
                "football": football_file,
                "basketball": basketball_file,
                "odds": odds_file
            }
        }
        
        # Save the manifest
        manifest_file = f"exports/export_manifest_{timestamp}.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        log_message(f"Training data export completed. Manifest saved to {manifest_file}")
        
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        log_message(f"Training data export completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        log_message(f"Error during training data export: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_training_data_export()