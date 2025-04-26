"""
Cloud function handler for the AI Sports Prediction service.
This module is designed to be deployed as a Google Cloud Function
that runs on a schedule to generate and store predictions.
"""
import logging
import json
from datetime import datetime
from main import run_prediction_pipeline
from config import initialize_firebase

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('cloud_function')

def predict_daily(event, context):
    """
    Cloud Function entry point to run the prediction pipeline.
    This function is triggered by a Cloud Scheduler job.
    
    Args:
        event (dict): The Cloud Functions event payload
        context (google.cloud.functions.Context): The Cloud Functions event metadata
        
    Returns:
        dict: Summary of the prediction run
    """
    try:
        logger.info("Starting daily prediction run")
        
        # Initialize Firebase
        initialized = initialize_firebase()
        if not initialized:
            logger.warning("Firebase not initialized. Storage and notifications will be disabled.")
            return {
                "success": False,
                "error": "Firebase not initialized",
                "timestamp": datetime.now().isoformat()
            }
        
        # Parse event data if any
        days_ahead = 3
        store_results = True
        notify_users = True
        
        if event and isinstance(event, dict):
            days_ahead = event.get('days_ahead', days_ahead)
            store_results = event.get('store_results', store_results)
            notify_users = event.get('notify_users', notify_users)
        
        # Run prediction pipeline
        logger.info(f"Running prediction pipeline for {days_ahead} days ahead")
        result = run_prediction_pipeline(
            days_ahead=days_ahead,
            store_results=store_results,
            notify_users=notify_users
        )
        
        if "error" in result:
            logger.error(f"Prediction pipeline failed: {result['error']}")
            return {
                "success": False,
                "error": result["error"],
                "timestamp": datetime.now().isoformat()
            }
        
        logger.info("Daily prediction run completed successfully")
        return {
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in cloud function: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }