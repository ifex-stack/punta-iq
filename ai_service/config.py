"""
Configuration module for the AI Sports Prediction service.
Loads environment variables and initializes Firebase.
"""
import os
import json
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('config')

# Load environment variables from .env file if it exists
load_dotenv()

# API Keys
FOOTBALL_API_KEY = os.environ.get('FOOTBALL_API_KEY')
BASKETBALL_API_KEY = os.environ.get('BASKETBALL_API_KEY')

# Supported sports configuration
SUPPORTED_SPORTS = {
    "football": {
        "display_name": "Football",
        "enabled": True,
        "default_model": "xgboost",
        "predictions": [
            "1X2", 
            "Over/Under", 
            "BTTS", 
            "Correct Score"
        ],
        "leagues": [
            {"id": 1, "name": "Premier League", "country": "England"},
            {"id": 2, "name": "La Liga", "country": "Spain"},
            {"id": 3, "name": "Serie A", "country": "Italy"},
            {"id": 4, "name": "Bundesliga", "country": "Germany"},
            {"id": 5, "name": "Ligue 1", "country": "France"},
            {"id": 6, "name": "Nigerian Professional League", "country": "Nigeria"}
        ]
    },
    "basketball": {
        "display_name": "Basketball",
        "enabled": True,
        "default_model": "random_forest",
        "predictions": [
            "Winner", 
            "Total Points", 
            "Spread"
        ],
        "leagues": [
            {"id": 1, "name": "NBA", "country": "USA"},
            {"id": 2, "name": "EuroLeague", "country": "Europe"}
        ]
    }
}

# Firebase configuration
FIREBASE_INITIALIZED = False

def initialize_firebase():
    """Initialize Firebase connection if credentials are available."""
    global FIREBASE_INITIALIZED
    
    # If already initialized, return True
    if FIREBASE_INITIALIZED:
        return True
    
    try:
        # Check if Firebase credentials are available
        firebase_credentials = os.environ.get('FIREBASE_CREDENTIALS')
        
        if not firebase_credentials:
            # Check if credentials file exists
            credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            
            if not credentials_path or not os.path.exists(credentials_path):
                logger.warning("Firebase credentials not found. Firebase features will be disabled.")
                return False
        
        # Initialize Firebase Admin SDK
        import firebase_admin
        from firebase_admin import credentials
        
        if firebase_credentials:
            # Parse JSON credentials from environment variable
            cred_dict = json.loads(firebase_credentials)
            cred = credentials.Certificate(cred_dict)
        else:
            # Use credentials file
            cred = credentials.Certificate(credentials_path)
        
        # Initialize app with a service account
        firebase_admin.initialize_app(cred)
        
        FIREBASE_INITIALIZED = True
        logger.info("Firebase initialized successfully")
        return True
    
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return False

# Initialize Firebase if credentials are available
if os.environ.get('FIREBASE_CREDENTIALS') or os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
    initialize_firebase()