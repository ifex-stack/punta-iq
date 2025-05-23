"""
REST API for the AI Sports Prediction service.
Provides endpoints for triggering predictions and retrieving results.
"""
import os
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify
from data_fetcher import DataFetcher
from predictor import Predictor
from storage import FirestoreStorage
from generate_training_data import train_and_save_models
from config import SUPPORTED_SPORTS, initialize_firebase

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api')

# Initialize Flask app
app = Flask(__name__)

# Initialize services
data_fetcher = DataFetcher()
predictor = Predictor()
storage = FirestoreStorage()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
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
        # Parse request parameters
        request_data = request.get_json() or {}
        days_ahead = request_data.get('days_ahead', 3)
        sports = request_data.get('sports', None)
        store_results = request_data.get('store_results', True)
        notify_users = request_data.get('notify_users', True)
        
        # Validate parameters
        if days_ahead < 1 or days_ahead > 14:
            return jsonify({
                "success": False,
                "error": "days_ahead must be between 1 and 14"
            }), 400
        
        # If sports not specified, use all enabled sports
        if not sports:
            sports = [sport for sport, config in SUPPORTED_SPORTS.items() if config["enabled"]]
        
        # Validate sports
        for sport in sports:
            if sport not in SUPPORTED_SPORTS:
                return jsonify({
                    "success": False,
                    "error": f"Sport '{sport}' is not supported"
                }), 400
            
            if not SUPPORTED_SPORTS[sport]["enabled"]:
                return jsonify({
                    "success": False,
                    "error": f"Sport '{sport}' is disabled"
                }), 400
        
        # Fetch matches for each sport
        all_matches = {}
        for sport in sports:
            logger.info(f"Fetching {sport} matches for {days_ahead} days ahead")
            matches = data_fetcher.fetch_matches_by_sport(sport, days_ahead)
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
            all_predictions[sport] = predictions
        
        # Generate accumulators
        accumulators = predictor.generate_accumulators(all_predictions)
        
        # Store predictions if requested
        if store_results:
            for sport, predictions in all_predictions.items():
                if predictions:
                    storage.store_predictions(predictions, sport)
            
            if accumulators:
                storage.store_accumulators(accumulators)
        
        # Send notifications if requested
        if notify_users and store_results:
            total_predictions = sum(len(predictions) for predictions in all_predictions.values())
            if total_predictions > 0:
                notification_title = "New Predictions Available"
                notification_body = f"{total_predictions} new predictions for {', '.join(sports)}"
                
                storage.send_notification(
                    user_ids=["all_users"],
                    title=notification_title,
                    body=notification_body,
                    data={
                        "type": "new_predictions",
                        "count": total_predictions,
                        "sports": sports
                    }
                )
        
        # Prepare response
        response = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "predictions": {
                sport: len(predictions) for sport, predictions in all_predictions.items()
            },
            "total_predictions": sum(len(predictions) for predictions in all_predictions.values()),
            "accumulators": len(accumulators)
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/predictions/sports/<sport>', methods=['GET'])
def get_sport_predictions(sport):
    """Get predictions for a specific sport."""
    try:
        # Validate sport
        if sport not in SUPPORTED_SPORTS:
            return jsonify({
                "success": False,
                "error": f"Sport '{sport}' is not supported"
            }), 400
        
        if not SUPPORTED_SPORTS[sport]["enabled"]:
            return jsonify({
                "success": False,
                "error": f"Sport '{sport}' is disabled"
            }), 400
        
        # Filter parameters
        min_confidence = request.args.get('min_confidence')
        tier = request.args.get('tier')
        include_premium = request.args.get('include_premium', 'true').lower() == 'true'
        
        # Get predictions from storage
        predictions = storage.get_predictions(sport)
        
        # Apply filters
        if min_confidence:
            try:
                min_conf_value = float(min_confidence)
                predictions = [p for p in predictions if p.get('confidence', 0) >= min_conf_value]
            except ValueError:
                logger.warning(f"Invalid min_confidence parameter: {min_confidence}")
        
        if tier:
            allowed_tiers = tier.split(',')
            predictions = [p for p in predictions if p.get('valueBet', {}).get('tier', 'Tier 10') in allowed_tiers]
        
        if not include_premium:
            predictions = [p for p in predictions if not p.get('isPremium', False)]
        
        # Enrich predictions with confidence level descriptions
        for prediction in predictions:
            confidence = prediction.get('confidence', 0)
            
            # Add confidence level if not already present
            if 'confidenceLevel' not in prediction:
                if confidence >= 85:
                    prediction['confidenceLevel'] = 'very high'
                elif confidence >= 70:
                    prediction['confidenceLevel'] = 'high'
                elif confidence >= 55:
                    prediction['confidenceLevel'] = 'medium'
                elif confidence >= 40:
                    prediction['confidenceLevel'] = 'low'
                else:
                    prediction['confidenceLevel'] = 'very low'
            
            # Add tier information if not already present
            if 'tier' not in prediction:
                value_bet = prediction.get('valueBet', {})
                prediction['tier'] = value_bet.get('tier', 'Tier 10')
        
        # Add metadata
        metadata = {
            "sport": {
                "name": SUPPORTED_SPORTS[sport]["display_name"],
                "competitions": SUPPORTED_SPORTS[sport]["leagues"]
            },
            "confidence_levels": {
                "very high": {"range": "85-100", "description": "Highest confidence predictions"},
                "high": {"range": "70-84", "description": "Strong confidence predictions"},
                "medium": {"range": "55-69", "description": "Moderate confidence predictions"},
                "low": {"range": "40-54", "description": "Lower confidence predictions"},
                "very low": {"range": "0-39", "description": "Lowest confidence predictions"}
            },
            "tiers": {
                "Tier 1": {"description": "Premium predictions with highest value", "isPremium": True},
                "Tier 2": {"description": "Premium predictions with good value", "isPremium": True},
                "Tier 5": {"description": "Standard predictions with reasonable value", "isPremium": False},
                "Tier 10": {"description": "Free predictions with varied confidence", "isPremium": False}
            }
        }
        
        return jsonify({
            "success": True,
            "sport": sport,
            "predictions": predictions,
            "count": len(predictions),
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata
        })
    
    except Exception as e:
        logger.error(f"Error getting {sport} predictions: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/predictions/accumulators', methods=['GET'])
def get_accumulators():
    """Get accumulator predictions."""
    try:
        # Check if tier filter was requested
        tier = request.args.get('tier')
        tier_category = request.args.get('tier_category')
        size = request.args.get('size')
        
        # Get accumulators from storage
        accumulators = storage.get_accumulators()
        
        # Filter by tier if specified (Tier 1, Tier 2, Tier 5, Tier 10)
        if tier:
            # Convert to list of allowed tiers
            allowed_tiers = tier.split(',')
            
            # Apply tier filtering to each category
            filtered_accumulators = {}
            for category, accas in accumulators.items():
                filtered_accumulators[category] = [
                    acca for acca in accas 
                    if acca.get("tier") in allowed_tiers
                ]
            
            accumulators = filtered_accumulators
        
        # Filter by tier category if specified (tier1, tier2, tier5, tier10, small, medium, large, mega)
        if tier_category and tier_category in accumulators:
            category_accas = accumulators.get(tier_category, [])
            accumulators = {tier_category: category_accas}
        
        # Filter by size if specified
        if size:
            try:
                size_value = int(size)
                for category, accas in list(accumulators.items()):
                    accumulators[category] = [a for a in accas if a.get("size") == size_value]
            except ValueError:
                logger.warning(f"Invalid size parameter: {size}")
        
        # Calculate total count across all categories
        total_count = sum(len(accas) for accas in accumulators.values())
        
        # Add enhanced metadata about tiers
        tier_metadata = {
            "tier1": {
                "name": "Tier 1",
                "description": "Premium selections with highest confidence and value",
                "isPremium": True
            },
            "tier2": {
                "name": "Tier 2",
                "description": "High confidence selections with strong value",
                "isPremium": True
            },
            "tier5": {
                "name": "Tier 5",
                "description": "Solid selections with reasonable value",
                "isPremium": False
            },
            "tier10": {
                "name": "Tier 10",
                "description": "Standard selections with varied confidence",
                "isPremium": False
            }
        }
        
        return jsonify({
            "success": True,
            "accumulators": accumulators,
            "count": total_count,
            "metadata": {
                "tiers": tier_metadata,
                "timestamp": datetime.now().isoformat(),
                "updateFrequency": "daily"
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting accumulators: {e}")
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
        # Parse request parameters
        request_data = request.get_json() or {}
        sport = request_data.get('sport')
        model_type = request_data.get('model_type')
        use_synthetic_data = request_data.get('use_synthetic_data', False)
        
        # Validate parameters
        if not sport:
            return jsonify({
                "success": False,
                "error": "sport is required"
            }), 400
        
        if sport not in SUPPORTED_SPORTS:
            return jsonify({
                "success": False,
                "error": f"Sport '{sport}' is not supported"
            }), 400
        
        if not model_type:
            model_type = SUPPORTED_SPORTS[sport].get("default_model", "random_forest")
        
        # Currently we only support synthetic data
        if use_synthetic_data:
            logger.info(f"Training {sport} models with synthetic data")
            success = train_and_save_models()
            
            return jsonify({
                "success": success,
                "sport": sport,
                "model_type": model_type,
                "timestamp": datetime.now().isoformat()
            })
        else:
            # In a real implementation, we would use historical data from a database
            logger.warning("Training with real historical data not implemented yet")
            return jsonify({
                "success": False,
                "error": "Training with real historical data not implemented yet. Set use_synthetic_data=true."
            }), 400
    
    except Exception as e:
        logger.error(f"Error training models: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/supported-sports', methods=['GET'])
def get_supported_sports():
    """Get list of supported sports and their configurations."""
    try:
        # Filter out internal configuration details
        sports_config = {}
        for sport, config in SUPPORTED_SPORTS.items():
            sports_config[sport] = {
                "name": config["display_name"],
                "enabled": config["enabled"],
                "predictions": config["predictions"],
                "leagues": config["leagues"]
            }
        
        return jsonify({
            "success": True,
            "sports": sports_config,
            "count": len(sports_config),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error getting supported sports: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Initialize Firebase if credentials are available
    initialize_firebase()
    
    # Start the server
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)