"""
PuntaIQ AI Sports Prediction Service
Main entry point for the API service
"""

import os
import sys
import logging
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_service.log')
    ]
)
logger = logging.getLogger('main')

def main():
    """Main entry point for the application."""
    parser = argparse.ArgumentParser(description='PuntaIQ AI Sports Prediction Service')
    parser.add_argument('--mode', choices=['api', 'cron', 'test'], default='api',
                      help='Run mode: api (run API server), cron (run cron jobs once), test (test integrations)')
    
    args = parser.parse_args()
    
    logger.info(f"Starting PuntaIQ AI Service in {args.mode} mode")
    
    if args.mode == 'api':
        # Import and start the API service
        from api_service import start_server
        start_server()
    
    elif args.mode == 'cron':
        # Import and run cron jobs once
        from cron_jobs import scheduler
        scheduler.run_all_jobs()
        logger.info("Cron jobs completed")
    
    elif args.mode == 'test':
        # Run tests for all integrations
        logger.info("Running integration tests")
        test_all_integrations()

def test_all_integrations():
    """Test all API integrations and Firebase connection."""
    from api_integrations import api_football
    from api_integrations import thesportsdb
    from api_integrations import balldontlie
    from firebase_init import test_firebase_connection
    
    test_results = {
        "timestamp": datetime.now().isoformat(),
        "tests": []
    }
    
    # Test API-Football
    logger.info("Testing API-Football integration...")
    try:
        success, response = api_football.test_api_connection()
        test_results["tests"].append({
            "name": "API-Football",
            "success": success,
            "message": "Connection successful" if success else "Connection failed"
        })
        logger.info(f"API-Football test: {'Success' if success else 'Failed'}")
    except Exception as e:
        test_results["tests"].append({
            "name": "API-Football",
            "success": False,
            "message": f"Exception: {str(e)}"
        })
        logger.error(f"API-Football test exception: {str(e)}")
    
    # Test TheSportsDB
    logger.info("Testing TheSportsDB integration...")
    try:
        success, response = thesportsdb.test_api_connection()
        test_results["tests"].append({
            "name": "TheSportsDB",
            "success": success,
            "message": "Connection successful" if success else "Connection failed"
        })
        logger.info(f"TheSportsDB test: {'Success' if success else 'Failed'}")
    except Exception as e:
        test_results["tests"].append({
            "name": "TheSportsDB",
            "success": False,
            "message": f"Exception: {str(e)}"
        })
        logger.error(f"TheSportsDB test exception: {str(e)}")
    
    # Test BallDontLie
    logger.info("Testing BallDontLie integration...")
    try:
        success, response = balldontlie.test_api_connection()
        test_results["tests"].append({
            "name": "BallDontLie",
            "success": success,
            "message": "Connection successful" if success else "Connection failed"
        })
        logger.info(f"BallDontLie test: {'Success' if success else 'Failed'}")
    except Exception as e:
        test_results["tests"].append({
            "name": "BallDontLie",
            "success": False,
            "message": f"Exception: {str(e)}"
        })
        logger.error(f"BallDontLie test exception: {str(e)}")
    
    # Test Firebase
    logger.info("Testing Firebase connection...")
    try:
        success, message = test_firebase_connection()
        test_results["tests"].append({
            "name": "Firebase",
            "success": success,
            "message": message
        })
        logger.info(f"Firebase test: {'Success' if success else 'Failed'} - {message}")
    except Exception as e:
        test_results["tests"].append({
            "name": "Firebase",
            "success": False,
            "message": f"Exception: {str(e)}"
        })
        logger.error(f"Firebase test exception: {str(e)}")
    
    # Print summary
    logger.info("=== Integration Test Summary ===")
    success_count = sum(1 for test in test_results["tests"] if test["success"])
    logger.info(f"Tests passed: {success_count}/{len(test_results['tests'])}")
    
    for test in test_results["tests"]:
        status = "✓" if test["success"] else "✗"
        logger.info(f"{status} {test['name']}: {test['message']}")
    
    return test_results

if __name__ == "__main__":
    main()