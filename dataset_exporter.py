"""
Training dataset exporter for PuntaIQ
Exports cached sports data from Firebase for AI model training
"""
import os
import csv
import json
import datetime
import pandas as pd
from firebase_init import get_db_reference, app

# Directory for exported files
EXPORTS_DIR = "exports"

# Create exports directory if it doesn't exist
if not os.path.exists(EXPORTS_DIR):
    os.makedirs(EXPORTS_DIR)

def log_message(message, level="INFO"):
    """Log a message with timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def format_export_timestamp():
    """Get a formatted timestamp for file naming."""
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

def export_football_fixtures():
    """Export football fixtures data to CSV for training."""
    log_message("Exporting football fixtures data...")
    
    # Get a reference to all football fixtures data
    fixtures_ref = get_db_reference("/cache/football/fixtures")
    fixtures_data = fixtures_ref.get()
    
    if not fixtures_data:
        log_message("No football fixtures data found.", "WARNING")
        return None
    
    # Prepare data for CSV export
    rows = []
    for date, date_data in fixtures_data.items():
        if not date_data or not date_data.get('response'):
            continue
            
        for fixture in date_data.get('response', []):
            try:
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
                    rows.append(row)
            except Exception as e:
                log_message(f"Error processing football fixture: {str(e)}", "ERROR")
                continue
    
    if not rows:
        log_message("No completed football fixtures found for training data.", "WARNING")
        return None
        
    # Convert to DataFrame and export to CSV
    df = pd.DataFrame(rows)
    filename = f"{EXPORTS_DIR}/football_training_data_{format_export_timestamp()}.csv"
    df.to_csv(filename, index=False)
    log_message(f"Exported {len(rows)} football fixtures to {filename}")
    
    return filename

def export_basketball_games():
    """Export basketball games data to CSV for training."""
    log_message("Exporting basketball games data...")
    
    # Get a reference to all NBA games data
    games_ref = get_db_reference("/cache/basketball/nba/games")
    games_data = games_ref.get()
    
    if not games_data:
        log_message("No basketball games data found.", "WARNING")
        return None
    
    # Prepare data for CSV export
    rows = []
    for date, date_data in games_data.items():
        if not date_data or not date_data.get('data'):
            continue
            
        for game in date_data.get('data', []):
            try:
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
                    rows.append(row)
            except Exception as e:
                log_message(f"Error processing basketball game: {str(e)}", "ERROR")
                continue
    
    if not rows:
        log_message("No completed basketball games found for training data.", "WARNING")
        return None
        
    # Convert to DataFrame and export to CSV
    df = pd.DataFrame(rows)
    filename = f"{EXPORTS_DIR}/basketball_training_data_{format_export_timestamp()}.csv"
    df.to_csv(filename, index=False)
    log_message(f"Exported {len(rows)} basketball games to {filename}")
    
    return filename

def export_odds_data():
    """Export betting odds data to CSV for training."""
    log_message("Exporting odds data...")
    
    # Sports to export odds for
    sports = ["soccer", "basketball", "americanfootball", "tennis", "icehockey"]
    all_rows = []
    
    for sport in sports:
        # Get a reference to odds data for this sport
        odds_ref = get_db_reference(f"/cache/{sport}/odds")
        odds_data = odds_ref.get()
        
        if not odds_data:
            log_message(f"No odds data found for {sport}.", "WARNING")
            continue
        
        # Process each event with odds
        for event in odds_data:
            try:
                commence_time = event.get('commence_time')
                home_team = event.get('home_team')
                away_team = event.get('away_team')
                
                for bookmaker in event.get('bookmakers', []):
                    bookmaker_name = bookmaker.get('key')
                    
                    for market in bookmaker.get('markets', []):
                        market_name = market.get('key')
                        
                        for outcome in market.get('outcomes', []):
                            row = {
                                'sport': sport,
                                'event_id': event.get('id'),
                                'commence_time': commence_time,
                                'home_team': home_team,
                                'away_team': away_team,
                                'bookmaker': bookmaker_name,
                                'market': market_name,
                                'outcome_name': outcome.get('name'),
                                'price': outcome.get('price')
                            }
                            all_rows.append(row)
            except Exception as e:
                log_message(f"Error processing odds data for {sport}: {str(e)}", "ERROR")
                continue
    
    if not all_rows:
        log_message("No odds data found for training.", "WARNING")
        return None
        
    # Convert to DataFrame and export to CSV
    df = pd.DataFrame(all_rows)
    filename = f"{EXPORTS_DIR}/odds_training_data_{format_export_timestamp()}.csv"
    df.to_csv(filename, index=False)
    log_message(f"Exported {len(all_rows)} odds entries to {filename}")
    
    return filename

def export_training_dataset():
    """Export all training datasets."""
    log_message("Starting dataset export...")
    
    try:
        # Export different types of data for training
        football_file = export_football_fixtures()
        basketball_file = export_basketball_games()
        odds_file = export_odds_data()
        
        # Create a manifest of exported files
        manifest = {
            "export_timestamp": datetime.datetime.now().isoformat(),
            "files": {
                "football": football_file,
                "basketball": basketball_file,
                "odds": odds_file
            }
        }
        
        # Save the manifest
        manifest_file = f"{EXPORTS_DIR}/export_manifest_{format_export_timestamp()}.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        log_message(f"Dataset export completed. Manifest saved to {manifest_file}")
        return manifest
        
    except Exception as e:
        log_message(f"Error during dataset export: {str(e)}", "ERROR")
        return None

if __name__ == "__main__":
    # Run the exporter if this script is called directly
    export_training_dataset()