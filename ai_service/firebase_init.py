"""
Firebase initialization module for AI Sports Prediction service.
This module handles the connection to Firebase for data storage and retrieval.
"""

import json
import os
import logging
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global Firebase app reference
firebase_app = None

def initialize_firebase():
    """Initialize Firebase connection with credentials from environment or file."""
    global firebase_app
    
    # If already initialized, return
    if firebase_app:
        logger.info("Firebase already initialized")
        return firebase_app
    
    try:
        # Check for credentials in environment variable
        firebase_cred_json = os.environ.get('FIREBASE_CRED_JSON')
        firebase_db_url = os.environ.get('FIREBASE_DB_URL')
        
        if not firebase_db_url:
            logger.error("Firebase database URL not provided in environment")
            return None
        
        # If JSON credentials are provided in the environment
        if firebase_cred_json:
            try:
                # Parse the JSON string
                cred_dict = json.loads(firebase_cred_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Using Firebase credentials from environment variable")
            except json.JSONDecodeError:
                logger.error("Invalid JSON in FIREBASE_CRED_JSON environment variable")
                return None
        else:
            # Check for a credentials file path
            cred_path = os.environ.get('FIREBASE_CRED_PATH', './serviceAccountKey.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                logger.info(f"Using Firebase credentials from file: {cred_path}")
            else:
                logger.error(f"Firebase credentials file not found at {cred_path}")
                return None
        
        # Initialize the app
        firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': firebase_db_url
        })
        
        logger.info("Firebase initialized successfully")
        return firebase_app
        
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return None

def get_firebase_app():
    """Get the Firebase app instance, initializing if necessary."""
    global firebase_app
    if not firebase_app:
        return initialize_firebase()
    return firebase_app

def save_to_firebase(path, data):
    """
    Save data to a specific path in Firebase
    
    Args:
        path (str): Firebase DB path
        data (dict): Data to save
        
    Returns:
        bool: Success status
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot save to Firebase: Not initialized")
            return False
        
        # Add timestamp if not present
        if isinstance(data, dict) and 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
            
        # Save data to Firebase
        ref = db.reference(path)
        ref.set(data)
        
        logger.info(f"Data saved to Firebase path: {path}")
        return True
    
    except Exception as e:
        logger.error(f"Error saving to Firebase: {e}")
        return False

def update_firebase(path, data):
    """
    Update data at a specific path in Firebase
    
    Args:
        path (str): Firebase DB path
        data (dict): Data to update
        
    Returns:
        bool: Success status
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot update Firebase: Not initialized")
            return False
        
        # Add last_updated timestamp
        if isinstance(data, dict):
            data['last_updated'] = datetime.now().isoformat()
            
        # Update data in Firebase
        ref = db.reference(path)
        ref.update(data)
        
        logger.info(f"Data updated in Firebase path: {path}")
        return True
    
    except Exception as e:
        logger.error(f"Error updating Firebase: {e}")
        return False

def get_from_firebase(path):
    """
    Get data from a specific path in Firebase
    
    Args:
        path (str): Firebase DB path
        
    Returns:
        dict or None: Retrieved data or None on error
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot get data from Firebase: Not initialized")
            return None
        
        # Get data from Firebase
        ref = db.reference(path)
        data = ref.get()
        
        if data:
            logger.info(f"Data retrieved from Firebase path: {path}")
        else:
            logger.info(f"No data found at Firebase path: {path}")
            
        return data
    
    except Exception as e:
        logger.error(f"Error getting data from Firebase: {e}")
        return None

def delete_from_firebase(path):
    """
    Delete data at a specific path in Firebase
    
    Args:
        path (str): Firebase DB path
        
    Returns:
        bool: Success status
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot delete from Firebase: Not initialized")
            return False
        
        # Delete data from Firebase
        ref = db.reference(path)
        ref.delete()
        
        logger.info(f"Data deleted from Firebase path: {path}")
        return True
    
    except Exception as e:
        logger.error(f"Error deleting from Firebase: {e}")
        return False

def push_to_firebase_list(path, data):
    """
    Push data to a list at a specific path in Firebase
    
    Args:
        path (str): Firebase DB path
        data (dict): Data to push
        
    Returns:
        str or None: Key of the new item or None on error
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot push to Firebase: Not initialized")
            return None
        
        # Add timestamp if not present
        if isinstance(data, dict) and 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
            
        # Push data to Firebase
        ref = db.reference(path)
        new_ref = ref.push(data)
        
        logger.info(f"Data pushed to Firebase path: {path}, key: {new_ref.key}")
        return new_ref.key
    
    except Exception as e:
        logger.error(f"Error pushing to Firebase: {e}")
        return None

def query_firebase(path, order_by=None, equal_to=None, start_at=None, end_at=None, limit_to_first=None, limit_to_last=None):
    """
    Query data from Firebase with various filters
    
    Args:
        path (str): Firebase DB path
        order_by (str, optional): Field to order by
        equal_to (str/int, optional): Filter for values equal to this
        start_at (str/int, optional): Filter for values starting at this
        end_at (str/int, optional): Filter for values ending at this
        limit_to_first (int, optional): Limit to first N results
        limit_to_last (int, optional): Limit to last N results
        
    Returns:
        dict or None: Retrieved data or None on error
    """
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            logger.error("Cannot query Firebase: Not initialized")
            return None
        
        # Build query
        ref = db.reference(path)
        
        if order_by:
            query = ref.order_by_child(order_by)
            
            if equal_to is not None:
                query = query.equal_to(equal_to)
            if start_at is not None:
                query = query.start_at(start_at)
            if end_at is not None:
                query = query.end_at(end_at)
                
            if limit_to_first:
                query = query.limit_to_first(limit_to_first)
            elif limit_to_last:
                query = query.limit_to_last(limit_to_last)
                
            data = query.get()
        else:
            data = ref.get()
        
        if data:
            logger.info(f"Data queried from Firebase path: {path}")
        else:
            logger.info(f"No data found for query at Firebase path: {path}")
            
        return data
    
    except Exception as e:
        logger.error(f"Error querying Firebase: {e}")
        return None

def test_firebase_connection():
    """Test the Firebase connection by writing and reading data"""
    try:
        # Ensure Firebase is initialized
        if not get_firebase_app():
            return False, "Firebase not initialized"
        
        # Create test path and data
        test_path = '/ai_service_test'
        test_data = {
            'test_id': 'firebase_connection_test',
            'timestamp': datetime.now().isoformat(),
            'status': 'testing'
        }
        
        # Write test data
        if not save_to_firebase(test_path, test_data):
            return False, "Failed to write test data to Firebase"
        
        # Read test data
        read_data = get_from_firebase(test_path)
        if not read_data:
            return False, "Failed to read test data from Firebase"
            
        # Compare test values
        if read_data.get('test_id') != test_data['test_id']:
            return False, "Data integrity check failed"
            
        # Delete test data
        if not delete_from_firebase(test_path):
            return False, "Failed to delete test data from Firebase"
            
        logger.info("Firebase connection test successful")
        return True, "Firebase connection successful"
    
    except Exception as e:
        logger.error(f"Firebase connection test failed: {e}")
        return False, f"Firebase connection test failed: {e}"

# Simple module test
if __name__ == "__main__":
    # Initialize Firebase
    initialize_firebase()
    
    # Test connection
    success, message = test_firebase_connection()
    print(f"Firebase Connection Test: {'Success' if success else 'Failed'}")
    print(f"Message: {message}")