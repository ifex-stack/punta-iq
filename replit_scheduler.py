"""
Replit Scheduler for PuntaIQ
Sets up scheduled tasks for data caching and export
"""
import os
import time
import datetime
import subprocess

# ==========================================================================
# Configuration
# ==========================================================================
LOG_FILE = "scheduler_log.txt"

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

def run_script(script_name):
    """Run a Python script and return its exit code."""
    try:
        log_message(f"Running script: {script_name}")
        result = subprocess.run(["python", script_name], check=True)
        log_message(f"Script {script_name} completed with exit code {result.returncode}")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        log_message(f"Error running script {script_name}: {e}", "ERROR")
        return False
    except Exception as e:
        log_message(f"Exception running script {script_name}: {e}", "ERROR")
        return False

# ==========================================================================
# Main Function
# ==========================================================================
def run_daily_tasks():
    """Run all the daily tasks in sequence."""
    start_time = datetime.datetime.now()
    log_message(f"Starting daily tasks at {start_time}")
    
    # Create necessary directories
    os.makedirs("cache", exist_ok=True)
    os.makedirs("exports", exist_ok=True)
    
    # Run each script in sequence
    tasks = [
        "cache_football_data.py",
        "cache_basketball_data.py",
        "cache_odds_data.py",
        "export_training_data.py"
    ]
    
    results = {}
    for task in tasks:
        success = run_script(task)
        results[task] = "Success" if success else "Failed"
        
        # Give the system a moment to recover
        time.sleep(2)
    
    # Log the summary
    log_message("Daily tasks summary:")
    for task, result in results.items():
        log_message(f"  {task}: {result}")
    
    end_time = datetime.datetime.now()
    duration = (end_time - start_time).total_seconds()
    log_message(f"All daily tasks completed in {duration:.2f} seconds")

def is_time_to_run(target_hour=4):
    """Check if it's time to run the daily tasks (default: 4 AM)."""
    current_hour = datetime.datetime.now().hour
    return current_hour == target_hour

def run_midnight_tasks():
    """Set of tasks that should run at midnight."""
    log_message("Running midnight tasks")
    run_script("cache_football_data.py")
    run_script("export_training_data.py")

def run_noon_tasks():
    """Set of tasks that should run at noon."""
    log_message("Running noon tasks")
    run_script("cache_basketball_data.py")
    run_script("cache_odds_data.py")

if __name__ == "__main__":
    # Command-line invocation runs all tasks immediately
    log_message("Script invoked directly, running all tasks")
    run_daily_tasks()