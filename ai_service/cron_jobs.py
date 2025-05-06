"""
Scheduled job management for the AI Sports Prediction service.
This module handles cron-like job scheduling for data collection and predictions.
"""

import time
import logging
import threading
import schedule
from datetime import datetime, timedelta
import pytz

# Import Firebase integration
import firebase_admin
from firebase_admin import db
from firebase_init import get_firebase_app, save_to_firebase, update_firebase, get_from_firebase

# Import API integrations
from api_integrations.api_football import get_upcoming_matches, fetch_fixtures_by_date_range
from api_integrations.thesportsdb import get_upcoming_events_by_sport
from api_integrations.balldontlie import get_upcoming_games

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global flags
is_running = False
scheduler_thread = None

def fetch_and_store_football_data():
    """Fetch football (soccer) data from API and store in Firebase"""
    logger.info("Running scheduled job: fetch_and_store_football_data")
    try:
        # Get upcoming matches for the next 7 days
        # Default league IDs include major European leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)
        league_ids = [39, 140, 135, 78, 61]  # Default to major leagues
        days_ahead = 7
        
        upcoming_matches = get_upcoming_matches(league_ids, days_ahead)
        
        # Store in Firebase by date
        if upcoming_matches and 'data' in upcoming_matches:
            matches_by_date = {}
            
            # Group matches by date
            for match in upcoming_matches['data']:
                match_date = match.get('date', '').split('T')[0]  # Extract date part
                if match_date:
                    if match_date not in matches_by_date:
                        matches_by_date[match_date] = []
                    matches_by_date[match_date].append(match)
            
            # Store each date's matches
            for date, matches in matches_by_date.items():
                date_path = f'/fixtures/football/{date}'
                save_to_firebase(date_path, {
                    'matches': matches,
                    'count': len(matches),
                    'updated_at': datetime.now().isoformat()
                })
                
            # Update the fixtures index
            index_path = '/fixtures/football/index'
            available_dates = list(matches_by_date.keys())
            update_firebase(index_path, {
                'available_dates': available_dates,
                'latest_update': datetime.now().isoformat()
            })
            
            logger.info(f"Stored football fixtures for {len(matches_by_date)} dates")
            return True
        else:
            logger.warning("No football matches returned from API")
            return False
            
    except Exception as e:
        logger.error(f"Error in fetch_and_store_football_data: {e}")
        return False

def fetch_and_store_basketball_data():
    """Fetch basketball data from API and store in Firebase"""
    logger.info("Running scheduled job: fetch_and_store_basketball_data")
    try:
        # Get upcoming NBA games
        days_ahead = 7
        upcoming_games = get_upcoming_games(days_ahead)
        
        # Store in Firebase by date
        if upcoming_games and 'data' in upcoming_games:
            games_by_date = {}
            
            # Group games by date
            for game in upcoming_games['data']:
                game_date = game.get('date', '').split('T')[0]  # Extract date part
                if game_date:
                    if game_date not in games_by_date:
                        games_by_date[game_date] = []
                    games_by_date[game_date].append(game)
            
            # Store each date's games
            for date, games in games_by_date.items():
                date_path = f'/fixtures/basketball/nba/{date}'
                save_to_firebase(date_path, {
                    'games': games,
                    'count': len(games),
                    'updated_at': datetime.now().isoformat()
                })
                
            # Update the fixtures index
            index_path = '/fixtures/basketball/nba/index'
            available_dates = list(games_by_date.keys())
            update_firebase(index_path, {
                'available_dates': available_dates,
                'latest_update': datetime.now().isoformat()
            })
            
            logger.info(f"Stored NBA fixtures for {len(games_by_date)} dates")
            return True
        else:
            logger.warning("No basketball games returned from API")
            return False
            
    except Exception as e:
        logger.error(f"Error in fetch_and_store_basketball_data: {e}")
        return False

def fetch_and_store_all_sports():
    """Fetch data for all supported sports and store in Firebase"""
    logger.info("Running scheduled job: fetch_and_store_all_sports")
    
    # Define which sports we're supporting
    sports = {
        "football": fetch_and_store_football_data,
        "basketball": fetch_and_store_basketball_data
    }
    
    results = {}
    for sport, fetch_func in sports.items():
        try:
            success = fetch_func()
            results[sport] = "Success" if success else "Failed"
        except Exception as e:
            logger.error(f"Error fetching {sport} data: {e}")
            results[sport] = f"Error: {str(e)}"
    
    # Store a job log in Firebase
    log_path = f'/job_logs/fetch_all_sports/{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}'
    save_to_firebase(log_path, {
        'results': results,
        'timestamp': datetime.now().isoformat()
    })
    
    # Update the last run timestamp
    update_firebase('/job_status/fetch_all_sports', {
        'last_run': datetime.now().isoformat(),
        'status': 'complete',
        'results': results
    })
    
    return results

def generate_basic_predictions():
    """Generate basic win/loss predictions for upcoming matches"""
    logger.info("Running scheduled job: generate_basic_predictions")
    try:
        # Get the next 3 days dates
        today = datetime.now().strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        dates_to_process = [today, tomorrow, day_after]
        predictions_count = 0
        
        # Process football matches
        for date in dates_to_process:
            # Get fixtures for the date
            fixtures_path = f'/fixtures/football/{date}'
            fixtures_data = get_from_firebase(fixtures_path)
            
            if not fixtures_data or 'matches' not in fixtures_data:
                continue
                
            matches = fixtures_data.get('matches', [])
            predictions = []
            
            for match in matches:
                # Generate a simple prediction
                # In a real app, this would use ML models
                home_team = match.get('home_team', {}).get('name', '')
                away_team = match.get('away_team', {}).get('name', '')
                
                if not home_team or not away_team:
                    continue
                    
                # Just a placeholder logic - real system would use ML
                home_win_prob = 0.45  # Home advantage
                draw_prob = 0.30
                away_win_prob = 0.25
                
                prediction = {
                    'match_id': match.get('id'),
                    'home_team': home_team,
                    'away_team': away_team,
                    'kickoff': match.get('date'),
                    'probabilities': {
                        'home_win': home_win_prob,
                        'draw': draw_prob,
                        'away_win': away_win_prob
                    },
                    'prediction': 'home_win' if home_win_prob > draw_prob and home_win_prob > away_win_prob else
                                  'draw' if draw_prob > home_win_prob and draw_prob > away_win_prob else 'away_win',
                    'confidence': max(home_win_prob, draw_prob, away_win_prob),
                    'generated_at': datetime.now().isoformat()
                }
                
                predictions.append(prediction)
            
            # Save predictions to Firebase
            if predictions:
                predictions_path = f'/predictions/football/{date}'
                save_to_firebase(predictions_path, {
                    'predictions': predictions,
                    'count': len(predictions),
                    'updated_at': datetime.now().isoformat()
                })
                predictions_count += len(predictions)
        
        # Update job status
        update_firebase('/job_status/generate_predictions', {
            'last_run': datetime.now().isoformat(),
            'status': 'complete',
            'count': predictions_count
        })
        
        logger.info(f"Generated {predictions_count} football predictions")
        return True
        
    except Exception as e:
        logger.error(f"Error in generate_basic_predictions: {e}")
        # Update job status with error
        update_firebase('/job_status/generate_predictions', {
            'last_run': datetime.now().isoformat(),
            'status': 'error',
            'error': str(e)
        })
        return False

def update_prediction_results():
    """Update prediction results based on completed matches"""
    logger.info("Running scheduled job: update_prediction_results")
    try:
        # Check for dates that need result updating (past dates with predictions)
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        two_days_ago = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        three_days_ago = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        
        dates_to_check = [yesterday, two_days_ago, three_days_ago]
        
        for date in dates_to_check:
            # Get predictions for the date
            predictions_path = f'/predictions/football/{date}'
            predictions_data = get_from_firebase(predictions_path)
            
            if not predictions_data or 'predictions' not in predictions_data:
                continue
                
            predictions = predictions_data.get('predictions', [])
            
            # Get actual match results for the date
            # In a real system, this would fetch actual results from the API
            # Here we're just simulating with random results
            
            updated_predictions = []
            for prediction in predictions:
                match_id = prediction.get('match_id')
                
                # Simulate getting actual result
                # In production, fetch the actual result from API
                import random
                outcomes = ['home_win', 'draw', 'away_win']
                actual_result = random.choice(outcomes)
                
                # Update prediction with result
                prediction['actual_result'] = actual_result
                prediction['correct'] = prediction.get('prediction') == actual_result
                prediction['verified_at'] = datetime.now().isoformat()
                
                updated_predictions.append(prediction)
            
            # Save updated predictions back to Firebase
            if updated_predictions:
                save_to_firebase(predictions_path, {
                    'predictions': updated_predictions,
                    'count': len(updated_predictions),
                    'updated_at': datetime.now().isoformat(),
                    'results_verified': True
                })
                
                logger.info(f"Updated {len(updated_predictions)} prediction results for {date}")
        
        # Update job status
        update_firebase('/job_status/update_prediction_results', {
            'last_run': datetime.now().isoformat(),
            'status': 'complete'
        })
        
        return True
        
    except Exception as e:
        logger.error(f"Error in update_prediction_results: {e}")
        # Update job status with error
        update_firebase('/job_status/update_prediction_results', {
            'last_run': datetime.now().isoformat(),
            'status': 'error',
            'error': str(e)
        })
        return False

def job_executor(job_func):
    """Execute a job and log its execution"""
    job_name = job_func.__name__
    start_time = datetime.now()
    
    logger.info(f"Starting job: {job_name} at {start_time.isoformat()}")
    
    try:
        result = job_func()
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Log execution to Firebase
        log_path = f'/job_logs/{job_name}/{start_time.strftime("%Y-%m-%d_%H-%M-%S")}'
        save_to_firebase(log_path, {
            'job_name': job_name,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': duration,
            'success': bool(result),
            'result': result
        })
        
        logger.info(f"Completed job: {job_name} in {duration:.2f} seconds")
        return result
    
    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        error_message = str(e)
        
        # Log error to Firebase
        log_path = f'/job_logs/{job_name}/{start_time.strftime("%Y-%m-%d_%H-%M-%S")}'
        save_to_firebase(log_path, {
            'job_name': job_name,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': duration,
            'success': False,
            'error': error_message
        })
        
        logger.error(f"Error in job {job_name}: {error_message}")
        return False

def scheduler_loop():
    """Run the scheduler loop in a thread"""
    global is_running
    
    logger.info("Starting scheduler loop")
    
    # Initialize Firebase if not already done
    get_firebase_app()
    
    while is_running:
        schedule.run_pending()
        time.sleep(1)
        
    logger.info("Scheduler loop stopped")

def setup_schedule():
    """Set up the schedule for all jobs"""
    # Clear any existing jobs
    schedule.clear()
    
    # Schedule football data fetch (3 times per day)
    schedule.every().day.at("00:00").do(lambda: job_executor(fetch_and_store_football_data))
    schedule.every().day.at("08:00").do(lambda: job_executor(fetch_and_store_football_data))
    schedule.every().day.at("16:00").do(lambda: job_executor(fetch_and_store_football_data))
    
    # Schedule basketball data fetch (twice per day)
    schedule.every().day.at("01:00").do(lambda: job_executor(fetch_and_store_basketball_data))
    schedule.every().day.at("13:00").do(lambda: job_executor(fetch_and_store_basketball_data))
    
    # Schedule all sports update (once per day)
    schedule.every().day.at("04:00").do(lambda: job_executor(fetch_and_store_all_sports))
    
    # Schedule prediction generation (twice per day)
    schedule.every().day.at("05:00").do(lambda: job_executor(generate_basic_predictions))
    schedule.every().day.at("17:00").do(lambda: job_executor(generate_basic_predictions))
    
    # Schedule result verification (once per day)
    schedule.every().day.at("03:00").do(lambda: job_executor(update_prediction_results))
    
    # Log the scheduled jobs
    logger.info("Scheduled the following jobs:")
    for job in schedule.get_jobs():
        logger.info(f"- {job}")
        
    # Store schedule in Firebase for monitoring
    job_schedules = [str(job) for job in schedule.get_jobs()]
    save_to_firebase('/job_status/schedule', {
        'jobs': job_schedules,
        'count': len(job_schedules),
        'updated_at': datetime.now().isoformat()
    })

def start_scheduler():
    """Start the scheduler thread"""
    global is_running, scheduler_thread
    
    if is_running:
        logger.warning("Scheduler is already running")
        return False
    
    # Set up the schedule
    setup_schedule()
    
    # Set the running flag
    is_running = True
    
    # Start the scheduler thread
    scheduler_thread = threading.Thread(target=scheduler_loop)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    logger.info("Scheduler started successfully")
    return True

def stop_scheduler():
    """Stop the scheduler thread"""
    global is_running, scheduler_thread
    
    if not is_running:
        logger.warning("Scheduler is not running")
        return False
    
    # Clear the running flag
    is_running = False
    
    # Wait for the thread to terminate
    if scheduler_thread:
        scheduler_thread.join(timeout=5.0)
    
    logger.info("Scheduler stopped successfully")
    return True

def run_job_now(job_name):
    """Run a specific job immediately"""
    jobs = {
        "football_data": fetch_and_store_football_data,
        "basketball_data": fetch_and_store_basketball_data,
        "all_sports": fetch_and_store_all_sports,
        "predictions": generate_basic_predictions,
        "update_results": update_prediction_results
    }
    
    if job_name not in jobs:
        logger.error(f"Unknown job name: {job_name}")
        return False
    
    logger.info(f"Running job immediately: {job_name}")
    return job_executor(jobs[job_name])

def get_scheduler_status():
    """Get the current status of the scheduler"""
    global is_running, scheduler_thread
    
    status = {
        "is_running": is_running,
        "thread_alive": scheduler_thread.is_alive() if scheduler_thread else False,
        "scheduled_jobs": [str(job) for job in schedule.get_jobs()],
        "jobs_count": len(schedule.get_jobs()),
        "timestamp": datetime.now().isoformat()
    }
    
    return status

# Module test
if __name__ == "__main__":
    # Initialize Firebase
    from firebase_init import initialize_firebase
    initialize_firebase()
    
    # Run a test job
    print("Running test job: fetch_and_store_football_data")
    result = job_executor(fetch_and_store_football_data)
    print(f"Test job result: {'Success' if result else 'Failed'}")
    
    # Test scheduler setup
    print("Setting up scheduler")
    setup_schedule()
    print(f"Scheduled {len(schedule.get_jobs())} jobs")
    
    # Don't start the scheduler in test mode