"""
Cron Jobs Module for PuntaIQ
Handles scheduled tasks for data fetching, caching, and maintenance.
"""

import os
import time
import json
import logging
from datetime import datetime, timedelta
import pytz
import firebase_admin

# Import our custom modules
from api_integrations import api_football
from api_integrations import thesportsdb
from api_integrations import balldontlie
from firebase_init import (
    initialize_firebase,
    store_sports_fixtures,
    get_sports_fixtures
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('cron_jobs')

# Default values for schedules (in seconds)
DEFAULT_UPDATE_INTERVAL = 3600  # 1 hour
LIVE_UPDATE_INTERVAL = 300  # 5 minutes

class CronJobScheduler:
    """
    Scheduler for running cron jobs at specified intervals.
    """
    
    def __init__(self):
        """Initialize the scheduler with default settings."""
        self.last_runs = {}
        self.firebase_initialized = False
        logger.info("Initializing CronJobScheduler")
        
        # Initialize Firebase connection
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize required services for cron jobs."""
        # Try to initialize Firebase
        firebase_app = initialize_firebase()
        self.firebase_initialized = (firebase_app is not None)
        
        if self.firebase_initialized:
            logger.info("Firebase initialized successfully for cron jobs")
        else:
            logger.warning("Firebase initialization failed, storage functionality will be limited")
        
        # Test API connections
        logger.info("Testing API connections...")
        self._test_api_connections()
    
    def _test_api_connections(self):
        """Test connections to all integrated APIs."""
        # Test API-Football
        success, _ = api_football.test_api_connection()
        if success:
            logger.info("API-Football connection test successful")
        else:
            logger.warning("API-Football connection test failed")
        
        # Test TheSportsDB
        success, _ = thesportsdb.test_api_connection()
        if success:
            logger.info("TheSportsDB connection test successful")
        else:
            logger.warning("TheSportsDB connection test failed")
        
        # Test BallDontLie
        success, _ = balldontlie.test_api_connection()
        if success:
            logger.info("BallDontLie connection test successful")
        else:
            logger.warning("BallDontLie connection test failed")
    
    def should_run(self, job_name, interval=DEFAULT_UPDATE_INTERVAL):
        """
        Check if a job should be run based on its last run time and interval.
        
        Args:
            job_name (str): Name of the job
            interval (int): Interval in seconds
            
        Returns:
            bool: True if the job should run, False otherwise
        """
        now = time.time()
        
        if job_name not in self.last_runs:
            logger.info(f"Job '{job_name}' has never run, scheduling now")
            self.last_runs[job_name] = now
            return True
        
        last_run = self.last_runs[job_name]
        should_run = (now - last_run) >= interval
        
        if should_run:
            logger.info(f"Job '{job_name}' is due to run (last run was {int(now - last_run)} seconds ago)")
            self.last_runs[job_name] = now
        
        return should_run
    
    def run_football_update(self):
        """Fetch and store football fixtures data."""
        if not self.should_run("football_update"):
            return
        
        logger.info("Running football fixtures update job")
        
        try:
            # Get today's date
            today = datetime.today().strftime("%Y-%m-%d")
            
            # Fetch fixtures for today and next 7 days
            fixtures_data = api_football.get_upcoming_matches(days_ahead=7)
            
            if not fixtures_data or not fixtures_data.get("data"):
                logger.warning("No football fixtures data received")
                return
            
            # Organize fixtures by date
            fixtures_by_date = {}
            for fixture in fixtures_data.get("data", []):
                date_str = fixture.get("date", "").split("T")[0]  # Extract date part
                if not date_str:
                    continue
                
                if date_str not in fixtures_by_date:
                    fixtures_by_date[date_str] = {}
                
                # Add fixture to the date with a unique key
                fixture_id = fixture.get("id")
                fixtures_by_date[date_str][f"match_{fixture_id}"] = {
                    "home_team": fixture.get("home_team", {}).get("name"),
                    "away_team": fixture.get("away_team", {}).get("name"),
                    "kickoff": fixture.get("date"),
                    "league": fixture.get("league", {}).get("name"),
                    "country": fixture.get("league", {}).get("country"),
                    "status": fixture.get("status")
                }
            
            # If Firebase is initialized, store the fixtures
            if self.firebase_initialized:
                success = store_sports_fixtures("football", fixtures_by_date)
                if success:
                    logger.info(f"Stored football fixtures for {len(fixtures_by_date)} dates")
                else:
                    logger.error("Failed to store football fixtures")
            else:
                # Log fixture counts if Firebase storage isn't available
                total_fixtures = sum(len(fixtures) for fixtures in fixtures_by_date.values())
                logger.info(f"Retrieved {total_fixtures} football fixtures for {len(fixtures_by_date)} dates (not stored)")
        
        except Exception as e:
            logger.error(f"Error in football update job: {str(e)}")
    
    def run_basketball_update(self):
        """Fetch and store basketball (NBA) fixtures data."""
        if not self.should_run("basketball_update"):
            return
        
        logger.info("Running basketball fixtures update job")
        
        try:
            # Fetch NBA games for next 7 days
            games_data = balldontlie.get_upcoming_games(days_ahead=7)
            
            if not games_data or not games_data.get("data"):
                logger.warning("No basketball games data received")
                return
            
            # Organize games by date
            games_by_date = {}
            for game in games_data.get("data", []):
                date_str = game.get("date", "").split("T")[0]  # Extract date part
                if not date_str:
                    continue
                
                if date_str not in games_by_date:
                    games_by_date[date_str] = {}
                
                # Add game to the date with a unique key
                game_id = game.get("id")
                games_by_date[date_str][f"game_{game_id}"] = {
                    "home_team": game.get("home_team", {}).get("name"),
                    "away_team": game.get("away_team", {}).get("name"),
                    "start_time": game.get("date"),
                    "status": game.get("status"),
                    "home_score": game.get("home_score"),
                    "away_score": game.get("away_score"),
                    "season": game.get("season"),
                    "postseason": game.get("postseason")
                }
            
            # If Firebase is initialized, store the games
            if self.firebase_initialized:
                success = store_sports_fixtures("nba", games_by_date)
                if success:
                    logger.info(f"Stored NBA games for {len(games_by_date)} dates")
                else:
                    logger.error("Failed to store NBA games")
            else:
                # Log game counts if Firebase storage isn't available
                total_games = sum(len(games) for games in games_by_date.values())
                logger.info(f"Retrieved {total_games} NBA games for {len(games_by_date)} dates (not stored)")
        
        except Exception as e:
            logger.error(f"Error in basketball update job: {str(e)}")
    
    def run_other_sports_update(self):
        """Fetch and store data for other sports using TheSportsDB."""
        if not self.should_run("other_sports_update"):
            return
        
        logger.info("Running update job for other sports")
        
        try:
            # List of sports to fetch
            sports_list = ["Soccer", "Basketball", "Baseball", "Ice Hockey", "American Football", "Tennis"]
            
            for sport in sports_list:
                logger.info(f"Fetching {sport} events from TheSportsDB")
                
                # Map TheSportsDB sport names to our standardized names
                sport_key_map = {
                    "Soccer": "football",
                    "Basketball": "basketball",
                    "Baseball": "baseball",
                    "Ice Hockey": "hockey",
                    "American Football": "american_football",
                    "Tennis": "tennis"
                }
                
                standardized_sport = sport_key_map.get(sport, sport.lower().replace(" ", "_"))
                
                # Fetch upcoming events
                events_data = thesportsdb.get_upcoming_events_by_sport(sport, days=7)
                
                if not events_data or not events_data.get("data"):
                    logger.warning(f"No {sport} events data received from TheSportsDB")
                    continue
                
                # Organize events by date
                events_by_date = {}
                for event in events_data.get("data", []):
                    date_str = event.get("date", "").split("T")[0]  # Extract date part
                    if not date_str:
                        continue
                    
                    if date_str not in events_by_date:
                        events_by_date[date_str] = {}
                    
                    # Add event to the date with a unique key
                    event_id = event.get("id")
                    events_by_date[date_str][f"event_{event_id}"] = {
                        "name": event.get("name"),
                        "home_team": event.get("home_team", {}).get("name"),
                        "away_team": event.get("away_team", {}).get("name"),
                        "start_time": event.get("date") + "T" + (event.get("time") or "00:00:00"),
                        "league": event.get("league", {}).get("name"),
                        "stadium": event.get("stadium"),
                        "sport": standardized_sport
                    }
                
                # Skip if no events found
                if not events_by_date:
                    logger.info(f"No upcoming {sport} events found")
                    continue
                
                # If Firebase is initialized, store the events
                if self.firebase_initialized:
                    success = store_sports_fixtures(standardized_sport, events_by_date)
                    if success:
                        logger.info(f"Stored {sport} events for {len(events_by_date)} dates")
                    else:
                        logger.error(f"Failed to store {sport} events")
                else:
                    # Log event counts if Firebase storage isn't available
                    total_events = sum(len(events) for events in events_by_date.values())
                    logger.info(f"Retrieved {total_events} {sport} events for {len(events_by_date)} dates (not stored)")
        
        except Exception as e:
            logger.error(f"Error in other sports update job: {str(e)}")
    
    def run_live_scores_update(self):
        """Fetch and update live scores for in-progress matches."""
        if not self.should_run("live_scores_update", interval=LIVE_UPDATE_INTERVAL):
            return
        
        logger.info("Running live scores update job")
        
        try:
            # Fetch live football matches
            live_football = api_football.fetch_live_fixtures()
            
            if not live_football or "errors" in live_football:
                logger.warning("No live football matches data received or API error")
            else:
                matches = live_football.get("response", [])
                logger.info(f"Retrieved {len(matches)} live football matches")
                
                # Process and store live scores if Firebase is initialized
                if self.firebase_initialized and matches:
                    # Create a live scores structure
                    live_data = {
                        "football": {},
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    for idx, match in enumerate(matches):
                        fixture = match.get("fixture", {})
                        teams = match.get("teams", {})
                        goals = match.get("goals", {})
                        
                        match_id = fixture.get("id")
                        live_data["football"][f"match_{match_id}"] = {
                            "home_team": teams.get("home", {}).get("name"),
                            "away_team": teams.get("away", {}).get("name"),
                            "home_score": goals.get("home"),
                            "away_score": goals.get("away"),
                            "elapsed_time": fixture.get("status", {}).get("elapsed"),
                            "status": fixture.get("status", {}).get("short"),
                            "kickoff": fixture.get("date")
                        }
                    
                    # Store live data in Firebase
                    ref = firebase_admin.db.reference("/live_scores")
                    ref.update(live_data)
                    logger.info(f"Updated {len(matches)} live football matches in Firebase")
        
        except Exception as e:
            logger.error(f"Error in live scores update job: {str(e)}")
    
    def run_maintenance_job(self):
        """Perform maintenance tasks like cleaning up old data."""
        if not self.should_run("maintenance_job", interval=24*3600):  # Run daily
            return
        
        logger.info("Running maintenance job")
        
        try:
            if not self.firebase_initialized:
                logger.warning("Firebase not initialized, skipping maintenance job")
                return
            
            # Calculate date threshold (e.g., 7 days ago)
            days_to_keep = 7
            cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).strftime("%Y-%m-%d")
            
            # Get a list of all sports
            sports_ref = firebase_admin.db.reference("/sports")
            sports = sports_ref.get()
            
            if not sports:
                logger.info("No sports data found for maintenance")
                return
            
            for sport, sport_data in sports.items():
                if not sport_data or "fixtures" not in sport_data:
                    continue
                
                fixtures = sport_data["fixtures"]
                dates_to_remove = []
                
                for date_str in fixtures:
                    if date_str < cutoff_date:
                        dates_to_remove.append(date_str)
                
                # Remove old fixtures
                fixtures_ref = firebase_admin.db.reference(f"/sports/{sport}/fixtures")
                for date_str in dates_to_remove:
                    fixtures_ref.child(date_str).delete()
                
                logger.info(f"Removed {len(dates_to_remove)} old fixture dates for {sport}")
        
        except Exception as e:
            logger.error(f"Error in maintenance job: {str(e)}")
    
    def run_all_jobs(self):
        """Run all scheduled cron jobs."""
        logger.info("Running all scheduled jobs")
        
        # Run data update jobs
        self.run_football_update()
        self.run_basketball_update()
        self.run_other_sports_update()
        self.run_live_scores_update()
        
        # Run maintenance job
        self.run_maintenance_job()
        
        logger.info("All scheduled jobs completed")

# Singleton instance of the scheduler
scheduler = CronJobScheduler()

def main_loop():
    """Main loop for running cron jobs at appropriate intervals."""
    logger.info("Starting cron job main loop")
    
    try:
        while True:
            # Run all jobs
            scheduler.run_all_jobs()
            
            # Sleep for a bit before checking again
            logger.info("Sleeping for 60 seconds before next check")
            time.sleep(60)
    
    except KeyboardInterrupt:
        logger.info("Cron job main loop interrupted, shutting down")
    except Exception as e:
        logger.error(f"Error in cron job main loop: {str(e)}")

if __name__ == "__main__":
    # This will execute only if the script is run directly
    main_loop()