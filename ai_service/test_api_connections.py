#!/usr/bin/env python3
"""
Test script for API connections
This script tests connections to all integrated APIs to verify your setup
"""

import os
import sys
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api_test')

def main():
    """
    Main function to test API connections
    """
    logger.info("=== PuntaIQ API Connection Test ===")
    
    # Test API modules
    try:
        # Try to import our modules
        logger.info("Importing API modules...")
        
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from api_integrations import api_football
        from api_integrations import thesportsdb
        from api_integrations import balldontlie
        
        logger.info("Successfully imported API modules.")
        
        # Test API-Football
        logger.info("\nTesting API-Football...")
        if not os.getenv("API_FOOTBALL_KEY"):
            logger.error("API_FOOTBALL_KEY environment variable not set!")
            logger.info("Please add your API-Football key to the .env file.")
        else:
            success, response = api_football.test_api_connection()
            if success:
                logger.info("✓ API-Football connection successful!")
            else:
                logger.error("✗ API-Football connection failed!")
                logger.error(f"Error details: {response}")
        
        # Test TheSportsDB
        logger.info("\nTesting TheSportsDB...")
        success, response = thesportsdb.test_api_connection()
        if success:
            logger.info("✓ TheSportsDB connection successful!")
            
            if os.getenv("THESPORTSDB_API_KEY") == "1":
                logger.warning("Using free tier of TheSportsDB API with limited functionality")
            else:
                logger.info("Using paid tier of TheSportsDB API")
        else:
            logger.error("✗ TheSportsDB connection failed!")
            logger.error(f"Error details: {response}")
        
        # Test BallDontLie
        logger.info("\nTesting BallDontLie...")
        success, response = balldontlie.test_api_connection()
        if success:
            logger.info("✓ BallDontLie connection successful!")
            
            if not os.getenv("BALLDONTLIE_API_KEY"):
                logger.warning("Using free tier of BallDontLie API with rate limits.")
            else:
                logger.info("Using paid tier of BallDontLie API")
        else:
            logger.error("✗ BallDontLie connection failed!")
            logger.error(f"Error details: {response}")
        
        # Test Firebase if available
        logger.info("\nTesting Firebase...")
        try:
            from firebase_init import test_firebase_connection
            
            success, message = test_firebase_connection()
            if success:
                logger.info("✓ Firebase connection successful!")
            else:
                logger.error("✗ Firebase connection failed!")
                logger.error(f"Error details: {message}")
        except ImportError:
            logger.error("Firebase modules not available. Make sure firebase-admin is installed.")
            
    except ImportError as e:
        logger.error(f"Error importing modules: {str(e)}")
        logger.error("Make sure all dependencies are installed using: pip install -r requirements.txt")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return 1
    
    logger.info("\n=== Test Complete ===")
    return 0

if __name__ == "__main__":
    # Load .env file if python-dotenv is available
    try:
        from dotenv import load_dotenv
        load_dotenv()
        logger.info("Loaded environment variables from .env file")
    except ImportError:
        logger.warning("python-dotenv not installed, using existing environment variables")
    
    sys.exit(main())