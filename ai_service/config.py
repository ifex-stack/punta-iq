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

# API keys for sports data services
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY")
THESPORTSDB_API_KEY = os.getenv("THESPORTSDB_API_KEY", "1")  # Default to free tier
BALLDONTLIE_API_KEY = os.getenv("BALLDONTLIE_API_KEY")  # Optional
ODDS_API_KEY = os.getenv("ODDS_API_KEY")

# Firebase configuration
FIREBASE_DB_URL = os.getenv("FIREBASE_DB_URL")
FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "./serviceAccountKey.json")
FIREBASE_CRED_JSON = os.getenv("FIREBASE_CRED_JSON")

# Default port for Flask API
PORT = int(os.getenv("PORT", 5000))

# Prediction model settings
PREDICTION_MODEL_PATH = os.getenv("PREDICTION_MODEL_PATH", "./models")
USE_LOCAL_MODELS = os.getenv("USE_LOCAL_MODELS", "True").lower() in ("true", "1", "t")

# Cache settings
CACHE_DURATION = int(os.getenv("CACHE_DURATION", 3600))  # Default 1 hour in seconds
MAX_CACHE_ITEMS = int(os.getenv("MAX_CACHE_ITEMS", 1000))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FILE = os.getenv("LOG_FILE", "ai_service.log")

# API rate limiting
MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", 60))

# Initialize logging level based on environment
numeric_level = getattr(logging, LOG_LEVEL, None)
if not isinstance(numeric_level, int):
    numeric_level = logging.INFO
    logger.warning(f"Invalid log level: {LOG_LEVEL}. Defaulting to INFO.")

logging.getLogger().setLevel(numeric_level)

def validate_config():
    """Validate the configuration settings."""
    missing_keys = []
    warnings = []
    
    # Check required API keys
    if not API_FOOTBALL_KEY:
        missing_keys.append("API_FOOTBALL_KEY")
    
    # Check Firebase configuration
    if not FIREBASE_DB_URL:
        missing_keys.append("FIREBASE_DB_URL")
    
    if not FIREBASE_CRED_JSON and not os.path.exists(FIREBASE_CRED_PATH):
        missing_keys.append("FIREBASE_CRED_JSON or FIREBASE_CRED_PATH")
    
    # Log warnings and missing keys
    if THESPORTSDB_API_KEY == "1":
        warnings.append("Using free tier of TheSportsDB API with limited functionality")
    
    if not BALLDONTLIE_API_KEY:
        warnings.append("BallDontLie API key not provided. Will use free tier with rate limits.")
    
    # Return validation results
    for warning in warnings:
        logger.warning(warning)
    
    if missing_keys:
        for key in missing_keys:
            logger.error(f"Missing required configuration: {key}")
        return False
    
    return True

def get_firebase_credentials():
    """Get Firebase credentials from environment or file."""
    if FIREBASE_CRED_JSON:
        try:
            return json.loads(FIREBASE_CRED_JSON)
        except json.JSONDecodeError:
            logger.error("Invalid Firebase credentials JSON format")
            return None
    
    if os.path.exists(FIREBASE_CRED_PATH):
        try:
            with open(FIREBASE_CRED_PATH, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error reading Firebase credentials file: {str(e)}")
            return None
    
    logger.error("No Firebase credentials available")
    return None

# Validate configuration on module import
config_valid = validate_config()
if not config_valid:
    logger.warning("Configuration validation failed. Service may not function correctly.")
else:
    logger.info("Configuration validation successful")

# Get environment name
ENV = os.getenv("ENV", "development").lower()
logger.info(f"Running in {ENV} environment")