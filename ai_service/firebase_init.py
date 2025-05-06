"""
Firebase Initialization Module
Handles the setup and connection to Firebase for database storage.
"""

import os
import json
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('firebase_init')

# Firebase configuration
FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "./serviceAccountKey.json")
FIREBASE_DB_URL = os.getenv("FIREBASE_DB_URL")

# Check if Firebase credentials are set as environment variables
FIREBASE_CRED_JSON = os.getenv("FIREBASE_CRED_JSON")

# Firebase app instance
firebase_app = None

def initialize_firebase():
    """Initialize Firebase connection if credentials are available."""
    global firebase_app
    
    # If Firebase is already initialized, return
    if firebase_app:
        return firebase_app
    
    try:
        # Check if we have credentials as JSON string (from environment variable)
        if FIREBASE_CRED_JSON:
            try:
                cred_dict = json.loads(FIREBASE_CRED_JSON)
                cred = credentials.Certificate(cred_dict)
                logger.info("Using Firebase credentials from environment variable")
            except json.JSONDecodeError:
                logger.error("Failed to parse Firebase credentials JSON from environment variable")
                return None
        # Otherwise, check for credentials file
        elif os.path.exists(FIREBASE_CRED_PATH):
            cred = credentials.Certificate(FIREBASE_CRED_PATH)
            logger.info(f"Using Firebase credentials from file: {FIREBASE_CRED_PATH}")
        else:
            logger.error("Firebase credentials not found")
            return None
        
        # Initialize the app
        if not FIREBASE_DB_URL:
            logger.error("FIREBASE_DB_URL environment variable is not set")
            return None
        
        firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': FIREBASE_DB_URL
        })
        
        logger.info("Firebase initialized successfully")
        return firebase_app
    
    except Exception as e:
        logger.error(f"Error initializing Firebase: {str(e)}")
        return None

def get_db_reference():
    """Get a reference to the Firebase database."""
    if not firebase_app:
        app = initialize_firebase()
        if not app:
            logger.error("Firebase not initialized, cannot get database reference")
            return None
    
    return db.reference()

def store_sports_fixtures(sport, fixtures):
    """
    Store sports fixtures in Firebase.
    
    Args:
        sport (str): The sport name (e.g., 'football', 'basketball')
        fixtures (dict): Fixtures data organized by date
    """
    app = initialize_firebase()
    if not app:
        logger.error("Firebase not initialized, cannot store fixtures")
        return False
    
    try:
        # Get a reference to the sports fixtures path
        ref = db.reference(f"/sports/{sport}/fixtures")
        
        # Update fixtures data
        ref.update(fixtures)
        
        logger.info(f"Stored {len(fixtures)} fixture dates for {sport}")
        return True
    
    except Exception as e:
        logger.error(f"Error storing fixtures: {str(e)}")
        return False

def store_user_data(user_id, user_data):
    """
    Store or update user data in Firebase.
    
    Args:
        user_id (str): The user's unique ID
        user_data (dict): User data to store/update
    """
    app = initialize_firebase()
    if not app:
        logger.error("Firebase not initialized, cannot store user data")
        return False
    
    try:
        # Get a reference to the user's path
        ref = db.reference(f"/users/{user_id}")
        
        # Add last updated timestamp
        user_data["last_updated"] = datetime.now().isoformat()
        
        # Update user data
        ref.update(user_data)
        
        logger.info(f"User data stored for user ID: {user_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error storing user data: {str(e)}")
        return False

def get_sports_fixtures(sport, date=None):
    """
    Retrieve sports fixtures from Firebase.
    
    Args:
        sport (str): The sport name (e.g., 'football', 'basketball')
        date (str, optional): Specific date in YYYY-MM-DD format
        
    Returns:
        dict: Fixtures data for the specified sport and date
    """
    app = initialize_firebase()
    if not app:
        logger.error("Firebase not initialized, cannot retrieve fixtures")
        return None
    
    try:
        # Get a reference to the sports fixtures path
        if date:
            ref = db.reference(f"/sports/{sport}/fixtures/{date}")
        else:
            ref = db.reference(f"/sports/{sport}/fixtures")
        
        # Get data
        fixtures = ref.get()
        
        if fixtures:
            logger.info(f"Retrieved fixtures for {sport}{' on ' + date if date else ''}")
        else:
            logger.info(f"No fixtures found for {sport}{' on ' + date if date else ''}")
        
        return fixtures
    
    except Exception as e:
        logger.error(f"Error retrieving fixtures: {str(e)}")
        return None

def get_user_data(user_id):
    """
    Retrieve user data from Firebase.
    
    Args:
        user_id (str): The user's unique ID
        
    Returns:
        dict: User data
    """
    app = initialize_firebase()
    if not app:
        logger.error("Firebase not initialized, cannot retrieve user data")
        return None
    
    try:
        # Get a reference to the user's path
        ref = db.reference(f"/users/{user_id}")
        
        # Get data
        user_data = ref.get()
        
        if user_data:
            logger.info(f"Retrieved data for user ID: {user_id}")
        else:
            logger.info(f"No data found for user ID: {user_id}")
        
        return user_data
    
    except Exception as e:
        logger.error(f"Error retrieving user data: {str(e)}")
        return None

# Test function to verify Firebase connection
def test_firebase_connection():
    """Test the Firebase connection."""
    app = initialize_firebase()
    if not app:
        logger.error("Firebase initialization failed")
        return False, "Firebase initialization failed"
    
    try:
        # Try to write and read a test value
        test_ref = db.reference("/test")
        test_value = {
            "timestamp": datetime.now().isoformat(),
            "message": "Test connection successful"
        }
        
        test_ref.set(test_value)
        logger.info("Test write successful")
        
        read_value = test_ref.get()
        logger.info("Test read successful")
        
        # Clean up
        test_ref.delete()
        logger.info("Test cleanup successful")
        
        return True, "Firebase connection test successful"
    
    except Exception as e:
        logger.error(f"Firebase connection test failed: {str(e)}")
        return False, f"Firebase connection test failed: {str(e)}"

if __name__ == "__main__":
    # This will execute only if the script is run directly
    success, message = test_firebase_connection()
    print(f"Firebase Connection Test: {'Success' if success else 'Failed'}")
    print(message)