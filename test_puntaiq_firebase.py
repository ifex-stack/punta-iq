"""
Firebase connection test script for PuntaIQ
Tests database connectivity and writes a test record
"""
import os
import json
import datetime
import traceback
from firebase_init import get_db_reference

def log_message(message):
    """Print a timestamped message."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def test_firebase_connection():
    """Test Firebase connection and basic operations."""
    log_message("Starting Firebase connection test...")
    
    # First, test basic connection
    root_ref = get_db_reference("/")
    if not root_ref:
        log_message("ERROR: Could not get Firebase root reference. Connection failed.")
        return False
    
    log_message("Successfully connected to Firebase")
    
    # Test write operation to a test location
    test_ref = get_db_reference("/test/connection_test")
    if not test_ref:
        log_message("ERROR: Could not get test reference path.")
        return False
    
    test_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "test_id": f"puntaiq_test_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
        "message": "PuntaIQ Firebase connection test",
        "success": True
    }
    
    try:
        test_ref.set(test_data)
        log_message("Successfully wrote test data to Firebase")
    except Exception as e:
        log_message(f"ERROR: Failed to write test data: {str(e)}")
        traceback.print_exc()
        return False
    
    # Test read operation from the test location
    try:
        read_data = test_ref.get()
        if read_data:
            log_message("Successfully read test data from Firebase")
            log_message(f"Test data: {json.dumps(read_data, indent=2)}")
            
            # Verify data matches what we wrote
            if read_data.get('test_id') == test_data['test_id']:
                log_message("Data verification successful")
            else:
                log_message("ERROR: Data verification failed - read data doesn't match written data")
                return False
        else:
            log_message("ERROR: Failed to read test data (returned None)")
            return False
    except Exception as e:
        log_message(f"ERROR: Failed to read test data: {str(e)}")
        traceback.print_exc()
        return False
    
    log_message("All Firebase connection tests passed successfully!")
    return True

if __name__ == "__main__":
    if test_firebase_connection():
        print("\n✅ Firebase connection test PASSED")
    else:
        print("\n❌ Firebase connection test FAILED")