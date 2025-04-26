"""
Configuration module for the AI Sports Prediction service.
Loads environment variables and initializes Firebase.
"""
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

# API keys
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY")
SPORTRADAR_KEY = os.getenv("SPORTRADAR_KEY")

# Firebase configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL")
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")

# Prediction schedule
PREDICTION_SCHEDULE = os.getenv("PREDICTION_SCHEDULE", "0 0 * * *")  # Default: run at midnight

# Sports to predict
SUPPORTED_SPORTS = {
    "football": {
        "enabled": True,
        "api": "api_football",
        "markets": ["1X2", "over_under", "btts", "correct_score"]
    },
    "basketball": {
        "enabled": True,
        "api": "sportradar",
        "markets": ["moneyline", "spread", "over_under"]
    },
    "tennis": {
        "enabled": True,
        "api": "sportradar",
        "markets": ["match_winner", "set_winner"]
    },
    "baseball": {
        "enabled": True,
        "api": "sportradar",
        "markets": ["moneyline", "run_line", "over_under"]
    },
    "hockey": {
        "enabled": True,
        "api": "sportradar",
        "markets": ["moneyline", "puck_line", "over_under"]
    }
}

# Initialize Firebase (if credentials are available)
firebase_app = None
db = None

def initialize_firebase():
    """Initialize Firebase connection if credentials are available."""
    global firebase_app, db
    
    try:
        if not firebase_app and all([FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL]):
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": FIREBASE_PROJECT_ID,
                "private_key": FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                "client_email": FIREBASE_CLIENT_EMAIL
            })
            
            firebase_app = firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DATABASE_URL
            })
            
            db = firestore.client()
            print("Firebase initialized successfully")
        else:
            print("Firebase credentials not found or already initialized")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")