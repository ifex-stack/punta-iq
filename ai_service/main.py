"""
Main module for the AI Sports Prediction service.
Orchestrates the entire prediction process including data fetching,
prediction generation, and storage.
"""
import os
import sys
import argparse
import logging
from datetime import datetime
from data_fetcher import DataFetcher
from predictor import Predictor
from storage import FirestoreStorage
from config import SUPPORTED_SPORTS, initialize_firebase
from generate_training_data import train_and_save_models

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('main')

def run_prediction_pipeline(days_ahead=3, store_results=True, notify_users=True):
    """
    Run the complete prediction pipeline.
    
    Args:
        days_ahead (int): Number of days ahead to predict
        store_results (bool): Whether to store results in Firebase
        notify_users (bool): Whether to send notifications to users
        
    Returns:
        dict: Generated predictions
    """
    try:
        logger.info(f"Starting prediction pipeline for {days_ahead} days ahead")
        
        # Initialize services
        data_fetcher = DataFetcher()
        predictor = Predictor()
        storage = FirestoreStorage()
        
        # Get enabled sports
        enabled_sports = [sport for sport, config in SUPPORTED_SPORTS.items() if config["enabled"]]
        logger.info(f"Enabled sports: {', '.join(enabled_sports)}")
        
        # Fetch matches for each sport
        all_matches = {}
        for sport in enabled_sports:
            logger.info(f"Fetching {sport} matches for {days_ahead} days ahead")
            matches = data_fetcher.fetch_matches_by_sport(sport, days_ahead)
            logger.info(f"Fetched {len(matches)} {sport} matches")
            all_matches[sport] = matches
        
        # Generate predictions for each sport
        all_predictions = {}
        for sport, matches in all_matches.items():
            if not matches:
                logger.warning(f"No matches found for {sport}")
                all_predictions[sport] = []
                continue
            
            logger.info(f"Generating predictions for {len(matches)} {sport} matches")
            predictions = predictor.predict_matches(matches, sport)
            logger.info(f"Generated {len(predictions)} {sport} predictions")
            all_predictions[sport] = predictions
        
        # Generate accumulators
        logger.info("Generating accumulator predictions")
        accumulators = predictor.generate_accumulators(all_predictions)
        logger.info(f"Generated {len(accumulators)} accumulators")
        
        # Store predictions if requested
        if store_results:
            logger.info("Storing predictions in Firebase")
            for sport, predictions in all_predictions.items():
                if predictions:
                    storage.store_predictions(predictions, sport)
            
            if accumulators:
                storage.store_accumulators(accumulators)
        
        # Send notifications if requested
        if notify_users and store_results:
            total_predictions = sum(len(predictions) for predictions in all_predictions.values())
            if total_predictions > 0:
                logger.info(f"Sending notification about {total_predictions} new predictions")
                notification_title = "New Predictions Available"
                notification_body = f"{total_predictions} new predictions for {', '.join(enabled_sports)}"
                
                storage.send_notification(
                    user_ids=["all_users"],
                    title=notification_title,
                    body=notification_body,
                    data={
                        "type": "new_predictions",
                        "count": total_predictions,
                        "sports": enabled_sports
                    }
                )
        
        # Prepare result
        result = {
            "timestamp": datetime.now().isoformat(),
            "predictions": {
                sport: len(predictions) for sport, predictions in all_predictions.items()
            },
            "total_predictions": sum(len(predictions) for predictions in all_predictions.values()),
            "accumulators": len(accumulators)
        }
        
        logger.info(f"Prediction pipeline completed successfully: {result}")
        return result
    
    except Exception as e:
        logger.error(f"Error in prediction pipeline: {e}")
        return {"error": str(e)}

def main():
    """
    Main entry point for the prediction service.
    Parse command line arguments and run the pipeline.
    """
    parser = argparse.ArgumentParser(description='AI Sports Prediction Service')
    parser.add_argument('--days', type=int, default=3, help='Number of days ahead to predict')
    parser.add_argument('--no-store', action='store_true', help='Do not store results in Firebase')
    parser.add_argument('--no-notify', action='store_true', help='Do not send notifications')
    parser.add_argument('--train', action='store_true', help='Train models with synthetic data')
    parser.add_argument('--serve', action='store_true', help='Start the REST API server')
    args = parser.parse_args()
    
    # Initialize Firebase
    if not args.no_store or not args.no_notify:
        initialized = initialize_firebase()
        if not initialized:
            logger.warning("Firebase not initialized. Storage and notifications will be disabled.")
    
    # Train models if requested
    if args.train:
        logger.info("Training models with synthetic data")
        success = train_and_save_models()
        if success:
            logger.info("Models trained successfully")
        else:
            logger.error("Failed to train models")
            return 1
    
    # Start API server if requested
    if args.serve:
        logger.info("Starting REST API server")
        from api import app
        port = int(os.environ.get('PORT', 5001))
        app.run(host='0.0.0.0', port=port, debug=False)
        return 0
    
    # Run prediction pipeline
    result = run_prediction_pipeline(
        days_ahead=args.days,
        store_results=not args.no_store,
        notify_users=not args.no_notify
    )
    
    if "error" in result:
        logger.error(f"Prediction pipeline failed: {result['error']}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())