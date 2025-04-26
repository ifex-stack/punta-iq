"""
REST API for the AI Sports Prediction service.
Provides endpoints for triggering predictions and retrieving results.
"""
from flask import Flask, request, jsonify
import logging
import os
import json
from datetime import datetime, timedelta

from data_fetcher import DataFetcher
from predictor import Predictor
from storage import FirestoreStorage
from config import initialize_firebase, SUPPORTED_SPORTS

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ai_prediction_api')

# Initialize Flask app
app = Flask(__name__)

# Initialize components
fetcher = DataFetcher()
predictor = Predictor()
storage = FirestoreStorage()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'ai_prediction_service'
    })

@app.route('/api/predictions/generate', methods=['POST'])
def generate_predictions():
    """
    Generate predictions for upcoming matches.
    
    Request body:
    {
        "days_ahead": 3,  # Optional, default is 3
        "sports": ["football", "basketball"],  # Optional, default is all enabled sports
        "store_results": true,  # Optional, default is true
        "notify_users": true  # Optional, default is true
    }
    """
    try:
        data = request.json or {}
        days_ahead = data.get('days_ahead', 3)
        requested_sports = data.get('sports', None)
        store_results = data.get('store_results', True)
        notify_users = data.get('notify_users', True)
        
        logger.info(f"Generating predictions for the next {days_ahead} days")
        
        # Filter sports if requested
        if requested_sports:
            sports_to_predict = {
                sport: config for sport, config in SUPPORTED_SPORTS.items()
                if sport in requested_sports and config["enabled"]
            }
        else:
            sports_to_predict = {
                sport: config for sport, config in SUPPORTED_SPORTS.items()
                if config["enabled"]
            }
        
        # Fetch matches for selected sports
        all_matches = {}
        for sport in sports_to_predict:
            logger.info(f"Fetching {sport} matches...")
            matches = fetcher.fetch_matches_by_sport(sport, days_ahead)
            all_matches[sport] = matches
            logger.info(f"Found {len(matches)} {sport} matches")
            
        # Generate predictions
        logger.info("Generating predictions...")
        all_predictions = {}
        
        for sport, matches in all_matches.items():
            if matches:
                logger.info(f"Generating predictions for {len(matches)} {sport} matches...")
                sport_predictions = predictor.predict_matches(matches, sport)
                all_predictions[sport] = sport_predictions
        
        # Generate accumulators
        logger.info("Generating accumulator predictions...")
        accumulators = predictor.generate_accumulators(all_predictions)
        
        # Store predictions if requested
        if store_results and storage:
            logger.info("Storing predictions...")
            for sport, predictions in all_predictions.items():
                success = storage.store_predictions(predictions, sport)
                logger.info(f"Stored {sport} predictions: {'Success' if success else 'Failed'}")
            
            # Store accumulators
            success = storage.store_accumulators(accumulators)
            logger.info(f"Stored accumulators: {'Success' if success else 'Failed'}")
        
        # Notify users if requested
        if notify_users and storage:
            logger.info("Sending notifications to users...")
            # In a real implementation, you would fetch user IDs from Firebase
            # based on their notification preferences
            
            user_ids = ["all_users"]  # Placeholder for all users
            title = "New Predictions Available"
            body = f"We've just updated predictions for {', '.join(all_predictions.keys())}. Check them out now!"
            
            success = storage.send_notification(user_ids, title, body)
            logger.info(f"Sent notifications: {'Success' if success else 'Failed'}")
        
        # Return results
        return jsonify({
            "success": True,
            "prediction_count": {
                sport: len(predictions) for sport, predictions in all_predictions.items()
            },
            "accumulator_count": len(accumulators),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error generating predictions: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/predictions/sports/<sport>', methods=['GET'])
def get_sport_predictions(sport):
    """Get predictions for a specific sport."""
    try:
        if sport not in SUPPORTED_SPORTS:
            return jsonify({
                "success": False,
                "error": f"Sport {sport} is not supported"
            }), 400
            
        predictions = storage.get_predictions(sport)
        
        return jsonify({
            "success": True,
            "sport": sport,
            "predictions": predictions,
            "count": len(predictions)
        })
    
    except Exception as e:
        logger.error(f"Error getting {sport} predictions: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/predictions/accumulators', methods=['GET'])
def get_accumulators():
    """Get accumulator predictions."""
    try:
        accumulators = storage.get_accumulators()
        
        return jsonify({
            "success": True,
            "accumulators": accumulators,
            "count": len(accumulators)
        })
    
    except Exception as e:
        logger.error(f"Error getting accumulators: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/train', methods=['POST'])
def train_models():
    """
    Train prediction models with historical data.
    
    Request body:
    {
        "sport": "football",  # Required
        "model_type": "xgboost",  # Optional, default depends on sport
        "use_synthetic_data": false  # Optional, default is false
    }
    """
    try:
        data = request.json or {}
        sport = data.get('sport')
        model_type = data.get('model_type', 'xgboost')
        use_synthetic_data = data.get('use_synthetic_data', False)
        
        if not sport:
            return jsonify({
                "success": False,
                "error": "Sport is required"
            }), 400
            
        if sport not in SUPPORTED_SPORTS:
            return jsonify({
                "success": False,
                "error": f"Sport {sport} is not supported"
            }), 400
        
        # Train the model
        logger.info(f"Training {sport} model with {model_type}...")
        
        if use_synthetic_data:
            # Use synthetic data for training
            from generate_training_data import generate_football_training_data, generate_basketball_training_data
            
            if sport == 'football':
                training_data = generate_football_training_data(n_samples=2000)
                success = predictor.train_football_model(training_data, model_type=model_type)
            elif sport == 'basketball':
                training_data = generate_basketball_training_data(n_samples=2000)
                # Placeholder - would be implemented in the Predictor class
                success = False
                logger.warning("Basketball model training not yet implemented")
            else:
                success = False
                logger.warning(f"Training for {sport} not yet implemented")
        else:
            # Use real historical data (not implemented yet)
            success = False
            logger.warning("Training with real historical data not yet implemented")
        
        return jsonify({
            "success": success,
            "sport": sport,
            "model_type": model_type,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error training model: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/supported-sports', methods=['GET'])
def get_supported_sports():
    """Get list of supported sports and their configurations."""
    try:
        return jsonify({
            "success": True,
            "sports": SUPPORTED_SPORTS
        })
    
    except Exception as e:
        logger.error(f"Error getting supported sports: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Initialize Firebase
    initialize_firebase()
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5001))
    
    # Run Flask app
    app.run(host='0.0.0.0', port=port, debug=True)