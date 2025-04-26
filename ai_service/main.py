"""
Main module for the AI Sports Prediction service.
Orchestrates the entire prediction process including data fetching,
prediction generation, and storage.
"""
import argparse
import os
import sys
import json
from datetime import datetime
import time

from data_fetcher import DataFetcher
from predictor import Predictor
from storage import FirestoreStorage
from config import SUPPORTED_SPORTS, initialize_firebase

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
    print(f"Starting prediction pipeline for the next {days_ahead} days")
    start_time = time.time()
    
    # Initialize components
    fetcher = DataFetcher()
    predictor = Predictor()
    storage = FirestoreStorage() if store_results else None
    
    # Step 1: Fetch upcoming matches for all enabled sports
    print("Fetching upcoming matches...")
    all_matches = fetcher.fetch_all_matches(days_ahead=days_ahead)
    
    total_matches = sum(len(matches) for sport, matches in all_matches.items())
    print(f"Fetched a total of {total_matches} matches across {len(all_matches)} sports")
    
    # Step 2: Generate predictions for each sport
    print("Generating predictions...")
    all_predictions = {}
    
    for sport, matches in all_matches.items():
        if matches:
            print(f"Generating predictions for {len(matches)} {sport} matches...")
            sport_predictions = predictor.predict_matches(matches, sport)
            all_predictions[sport] = sport_predictions
    
    # Step 3: Generate accumulators
    print("Generating accumulator predictions...")
    accumulators = predictor.generate_accumulators(all_predictions)
    
    # Step 4: Store predictions if requested
    if store_results and storage:
        print("Storing predictions in Firebase...")
        for sport, predictions in all_predictions.items():
            success = storage.store_predictions(predictions, sport)
            print(f"Stored {sport} predictions: {'Success' if success else 'Failed'}")
        
        # Store accumulators
        success = storage.store_accumulators(accumulators)
        print(f"Stored accumulators: {'Success' if success else 'Failed'}")
    
    # Step 5: Send notifications if requested
    if notify_users and storage:
        print("Sending notifications to users...")
        # In a real implementation, you would fetch user IDs from Firebase
        # based on their notification preferences
        
        # Example notification
        user_ids = ["all_users"]  # Placeholder for all users
        title = "New Predictions Available"
        body = f"We've just updated predictions for {', '.join(all_predictions.keys())}. Check them out now!"
        
        success = storage.send_notification(user_ids, title, body)
        print(f"Sent notifications: {'Success' if success else 'Failed'}")
    
    # Calculate execution time
    execution_time = time.time() - start_time
    print(f"Prediction pipeline completed in {execution_time:.2f} seconds")
    
    # Return all generated predictions
    return {
        "predictions": all_predictions,
        "accumulators": accumulators,
        "timestamp": datetime.now().isoformat(),
        "execution_time": execution_time
    }

def main():
    """
    Main entry point for the prediction service.
    Parse command line arguments and run the pipeline.
    """
    parser = argparse.ArgumentParser(description="AI Sports Prediction Service")
    parser.add_argument("--days", type=int, default=3, help="Number of days ahead to predict")
    parser.add_argument("--no-store", action="store_true", help="Don't store results in Firebase")
    parser.add_argument("--no-notify", action="store_true", help="Don't send user notifications")
    parser.add_argument("--output", type=str, help="Output file for predictions (JSON)")
    args = parser.parse_args()
    
    try:
        # Initialize Firebase (will only succeed if credentials are provided)
        initialize_firebase()
        
        # Run prediction pipeline
        results = run_prediction_pipeline(
            days_ahead=args.days,
            store_results=not args.no_store,
            notify_users=not args.no_notify
        )
        
        # Save to output file if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"Predictions saved to {args.output}")
        
        return 0
        
    except Exception as e:
        print(f"Error in prediction pipeline: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())