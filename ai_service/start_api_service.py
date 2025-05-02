import subprocess
import os
import time
import signal
import sys

def start_api_service():
    """Start the API service in the background"""
    print("Starting PuntaIQ API Service...")
    
    # Check if required environment variables are set
    required_vars = ['ODDS_API_KEY', 'SPORTSDB_API_KEY']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"Error: The following environment variables are required: {', '.join(missing_vars)}")
        print("Please make sure they are set in the .env file")
        return None
    
    # Start the API service
    try:
        process = subprocess.Popen(
            ["python", os.path.join(os.path.dirname(__file__), "api_service.py")],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(f"API Service started with PID: {process.pid}")
        
        # Give it some time to start
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            print("Error starting API Service:")
            if stdout:
                print("STDOUT:", stdout)
            if stderr:
                print("STDERR:", stderr)
            return None
        
        return process
    
    except Exception as e:
        print(f"Error starting API Service: {str(e)}")
        return None

def stop_api_service(process):
    """Stop the API service"""
    if process is not None:
        print(f"Stopping API Service (PID: {process.pid})...")
        
        # Try to terminate gracefully
        process.terminate()
        
        # Wait for process to terminate, or kill it after timeout
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("API Service did not terminate gracefully, forcefully killing it")
            process.kill()
        
        print("API Service stopped")

if __name__ == "__main__":
    """Standalone script to start/stop the API service"""
    process = None
    
    try:
        process = start_api_service()
        
        if process:
            print("API Service is running. Press Ctrl+C to stop.")
            # Wait for Ctrl+C
            while True:
                time.sleep(1)
    
    except KeyboardInterrupt:
        print("\nReceived interrupt signal")
    
    finally:
        stop_api_service(process)
        sys.exit(0)