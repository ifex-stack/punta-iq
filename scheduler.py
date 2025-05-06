"""
Scheduler for PuntaIQ data services
Runs scheduled tasks for cache updates and dataset exports
"""
import os
import time
import datetime
import schedule
from cache_updater import run_full_cache_update
from dataset_exporter import export_training_dataset

def log_message(message, level="INFO"):
    """Log a message with timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def run_cache_update_job():
    """Run cache update as a scheduled job."""
    log_message("Running scheduled cache update...")
    success = run_full_cache_update()
    if success:
        log_message("Scheduled cache update completed successfully.")
    else:
        log_message("Scheduled cache update failed.", "ERROR")
    return success

def run_dataset_export_job():
    """Run dataset export as a scheduled job."""
    log_message("Running scheduled dataset export...")
    result = export_training_dataset()
    if result:
        log_message("Scheduled dataset export completed successfully.")
    else:
        log_message("Scheduled dataset export failed.", "ERROR")
    return result

def initialize_schedule():
    """Initialize the schedule with all jobs."""
    log_message("Initializing schedule...")
    
    # Schedule cache updates multiple times per day
    schedule.every().day.at("05:00").do(run_cache_update_job)  # Morning update
    schedule.every().day.at("12:00").do(run_cache_update_job)  # Midday update
    schedule.every().day.at("18:00").do(run_cache_update_job)  # Evening update
    
    # Schedule dataset export once per day (early morning)
    schedule.every().day.at("04:00").do(run_dataset_export_job)
    
    log_message("Schedule initialized with the following jobs:")
    log_message("- Cache updates: 05:00, 12:00, 18:00 UTC")
    log_message("- Dataset export: 04:00 UTC")

def run_scheduler():
    """Run the scheduler loop."""
    initialize_schedule()
    
    log_message("Scheduler started.")
    
    # If we're testing, run jobs immediately
    if os.environ.get('RUN_JOBS_IMMEDIATELY') == 'true':
        log_message("Test mode: Running jobs immediately...")
        run_cache_update_job()
        run_dataset_export_job()
    
    # Main loop
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except Exception as e:
            log_message(f"Error in scheduler loop: {str(e)}", "ERROR")
            time.sleep(300)  # Wait 5 minutes on error before retrying

if __name__ == "__main__":
    run_scheduler()