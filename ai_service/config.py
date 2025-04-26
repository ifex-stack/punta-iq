"""
Configuration module for the AI Sports Prediction service.
Loads environment variables and initializes Firebase.
"""
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Supported sports configuration
SUPPORTED_SPORTS = {
    "football": {
        "enabled": True,
        "display_name": "Football",
        "predictions": ["1X2", "Under/Over", "BTTS", "Correct Score"],
        "default_model": "xgboost",
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
        "enabled": True,
        "display_name": "Basketball",
        "predictions": ["Winner", "Total Points", "Spread"],
        "default_model": "gradient_boosting",
        "leagues": [
            {"id": 1, "name": "NBA", "country": "USA"},
            {"id": 2, "name": "EuroLeague", "country": "Europe"}
        ]
    },
    "tennis": {
        "enabled": False,
        "display_name": "Tennis",
        "predictions": ["Winner", "Total Games", "Set Score"],
        "default_model": "random_forest",
        "leagues": [
            {"id": 1, "name": "ATP", "country": "International"},
            {"id": 2, "name": "WTA", "country": "International"}
        ]
    }
}

# API Keys
FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY")
BASKETBALL_API_KEY = os.getenv("BASKETBALL_API_KEY")

# Firebase configuration
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")

def initialize_firebase():
    """Initialize Firebase connection if credentials are available."""
    if FIREBASE_CREDENTIALS:
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            # Load credentials from environment variable or file
            if os.path.exists(FIREBASE_CREDENTIALS):
                # Load from file
                cred = credentials.Certificate(FIREBASE_CREDENTIALS)
            else:
                # Try to parse JSON from environment variable
                import json
                cred_json = json.loads(FIREBASE_CREDENTIALS)
                cred = credentials.Certificate(cred_json)
                
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            return False
    else:
        logger.warning("Firebase credentials not found. Firebase functionality will be disabled.")
        return False