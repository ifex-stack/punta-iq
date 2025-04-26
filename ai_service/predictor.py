"""
Prediction module for the AI Sports Prediction service.
Uses machine learning models to predict match outcomes.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
import xgboost as XGBClassifier
import pickle
import os
from datetime import datetime

class Predictor:
    """Class to generate predictions using ML models."""
    
    def __init__(self):
        """Initialize the Predictor."""
        self.models = {}
        self.confidence_scaler = 0.8  # Scale factor for confidence adjustment
        
    def train_football_model(self, historical_data, model_type="xgboost"):
        """
        Train a model for football match predictions.
        
        Args:
            historical_data (pd.DataFrame): Historical match data
            model_type (str): Type of model to train (random_forest, gradient_boosting, xgboost)
            
        Returns:
            bool: True if training was successful
        """
        try:
            # Prepare features and target
            X = historical_data[['home_team_rank', 'away_team_rank', 'home_form', 'away_form', 
                                'home_goals_scored_avg', 'away_goals_scored_avg',
                                'home_goals_conceded_avg', 'away_goals_conceded_avg']]
            
            # For 1X2 prediction
            y = historical_data['result']  # 'home_win', 'draw', 'away_win'
            
            # Define preprocessing for numeric features
            numeric_features = ['home_team_rank', 'away_team_rank', 'home_form', 'away_form', 
                               'home_goals_scored_avg', 'away_goals_scored_avg',
                               'home_goals_conceded_avg', 'away_goals_conceded_avg']
            
            numeric_transformer = Pipeline(steps=[
                ('scaler', StandardScaler())
            ])
            
            # Create preprocessor
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', numeric_transformer, numeric_features)
                ])
            
            # Choose model based on type
            if model_type == "random_forest":
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            elif model_type == "gradient_boosting":
                model = GradientBoostingClassifier(n_estimators=100, random_state=42)
            else:  # Default to XGBoost
                model = XGBClassifier(n_estimators=100, random_state=42)
            
            # Create pipeline with preprocessing and model
            pipeline = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('model', model)
            ])
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Train model
            pipeline.fit(X_train, y_train)
            
            # Evaluate model
            accuracy = pipeline.score(X_test, y_test)
            print(f"Football {model_type} model accuracy: {accuracy:.4f}")
            
            # Save model
            self.models['football_1x2'] = pipeline
            
            # Save model to file
            model_dir = 'models'
            os.makedirs(model_dir, exist_ok=True)
            with open(f"{model_dir}/football_1x2_{model_type}.pkl", 'wb') as f:
                pickle.dump(pipeline, f)
                
            return True
            
        except Exception as e:
            print(f"Error training football model: {e}")
            return False
    
    def predict_football_match(self, match_data):
        """
        Generate predictions for a football match.
        
        Args:
            match_data (dict): Match data including team stats
            
        Returns:
            dict: Prediction results for various markets
        """
        predictions = {}
        
        try:
            # 1X2 prediction
            if 'football_1x2' in self.models:
                # Extract features needed for prediction
                features = pd.DataFrame({
                    'home_team_rank': [match_data.get('home_team_rank', 10)],
                    'away_team_rank': [match_data.get('away_team_rank', 10)],
                    'home_form': [match_data.get('home_form', 50)],
                    'away_form': [match_data.get('away_form', 50)],
                    'home_goals_scored_avg': [match_data.get('home_goals_scored_avg', 1.5)],
                    'away_goals_scored_avg': [match_data.get('away_goals_scored_avg', 1.2)],
                    'home_goals_conceded_avg': [match_data.get('home_goals_conceded_avg', 1.0)],
                    'away_goals_conceded_avg': [match_data.get('away_goals_conceded_avg', 1.0)]
                })
                
                # Get prediction
                prediction = self.models['football_1x2'].predict(features)[0]
                
                # Get probabilities
                probs = self.models['football_1x2'].predict_proba(features)[0]
                
                # Interpret prediction and confidence
                outcomes = {'home_win': probs[0], 'draw': probs[1], 'away_win': probs[2]}
                
                # Find the most likely outcome
                most_likely = max(outcomes, key=outcomes.get)
                confidence = outcomes[most_likely] * 100 * self.confidence_scaler
                
                # Create 1X2 prediction
                predictions['1x2'] = {
                    'predicted_outcome': most_likely,
                    'confidence': min(round(confidence), 95),  # Cap at 95%
                    'probabilities': {
                        'home_win': round(outcomes['home_win'] * 100, 2),
                        'draw': round(outcomes['draw'] * 100, 2),
                        'away_win': round(outcomes['away_win'] * 100, 2)
                    }
                }
                
                # BTTS prediction (simplified approach)
                # In a real implementation, you'd have a separate model for this
                home_scoring_prob = match_data.get('home_goals_scored_avg', 1.5) / (match_data.get('away_goals_conceded_avg', 1.0) + 0.5)
                away_scoring_prob = match_data.get('away_goals_scored_avg', 1.2) / (match_data.get('home_goals_conceded_avg', 1.0) + 0.5)
                btts_prob = home_scoring_prob * away_scoring_prob
                
                predictions['btts'] = {
                    'predicted_outcome': 'yes' if btts_prob > 0.6 else 'no',
                    'confidence': round(max(btts_prob, 1 - btts_prob) * 100),
                    'probabilities': {
                        'yes': round(btts_prob * 100, 2),
                        'no': round((1 - btts_prob) * 100, 2)
                    }
                }
                
                # Over/Under prediction (simplified approach)
                expected_goals = match_data.get('home_goals_scored_avg', 1.5) + match_data.get('away_goals_scored_avg', 1.2)
                over_under_threshold = 2.5
                over_prob = 1 / (1 + np.exp(-(expected_goals - over_under_threshold)))
                
                predictions['over_under'] = {
                    'threshold': over_under_threshold,
                    'predicted_outcome': 'over' if over_prob > 0.55 else 'under',
                    'confidence': round(max(over_prob, 1 - over_prob) * 100),
                    'probabilities': {
                        'over': round(over_prob * 100, 2),
                        'under': round((1 - over_prob) * 100, 2)
                    }
                }
                
            else:
                print("Football 1X2 model not found")
        
        except Exception as e:
            print(f"Error predicting football match: {e}")
        
        return predictions
    
    def predict_basketball_game(self, game_data):
        """
        Generate predictions for a basketball game.
        
        Args:
            game_data (dict): Game data including team stats
            
        Returns:
            dict: Prediction results for various markets
        """
        # Placeholder for basketball prediction
        # In a real implementation, this would use a trained model for basketball
        # Similar to football but with basketball-specific features and outcomes
        return {
            'moneyline': {
                'predicted_outcome': 'home',
                'confidence': 65,
                'probabilities': {
                    'home': 65,
                    'away': 35
                }
            }
        }
    
    def predict_matches(self, matches_data, sport):
        """
        Generate predictions for all matches of a specific sport.
        
        Args:
            matches_data (list): List of matches to predict
            sport (str): Sport name
            
        Returns:
            list: Matches with predictions added
        """
        predictions = []
        
        try:
            for match in matches_data:
                match_copy = match.copy()
                
                # Add prediction based on sport
                if sport == "football":
                    match_copy['predictions'] = self.predict_football_match(match)
                elif sport == "basketball":
                    match_copy['predictions'] = self.predict_basketball_game(match)
                else:
                    match_copy['predictions'] = {}
                    print(f"Prediction for {sport} not implemented yet")
                
                # Add prediction timestamp
                match_copy['prediction_timestamp'] = datetime.now().isoformat()
                
                # Add prediction tier based on confidence
                highest_confidence = 0
                for market, prediction in match_copy['predictions'].items():
                    if prediction.get('confidence', 0) > highest_confidence:
                        highest_confidence = prediction.get('confidence', 0)
                
                if highest_confidence >= 85:
                    match_copy['tier'] = 'elite'
                elif highest_confidence >= 75:
                    match_copy['tier'] = 'pro'
                else:
                    match_copy['tier'] = 'basic'
                
                predictions.append(match_copy)
        
        except Exception as e:
            print(f"Error generating predictions: {e}")
        
        return predictions
    
    def generate_accumulator(self, predictions, size=2, min_confidence=75):
        """
        Generate accumulator predictions based on highest confidence matches.
        
        Args:
            predictions (list): List of match predictions
            size (int): Number of matches to include in accumulator
            min_confidence (int): Minimum confidence threshold
            
        Returns:
            dict: Accumulator prediction
        """
        # Filter predictions by confidence
        high_confidence_predictions = []
        
        for match in predictions:
            # Find the highest confidence prediction for this match
            best_market = None
            best_confidence = 0
            
            for market, prediction in match.get('predictions', {}).items():
                confidence = prediction.get('confidence', 0)
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_market = market
            
            if best_confidence >= min_confidence:
                high_confidence_predictions.append({
                    'match_id': match.get('match_id'),
                    'sport': match.get('sport'),
                    'home_team': match.get('home_team'),
                    'away_team': match.get('away_team'),
                    'start_time': match.get('start_time'),
                    'market': best_market,
                    'prediction': match['predictions'][best_market]['predicted_outcome'],
                    'confidence': best_confidence
                })
        
        # Sort by confidence
        high_confidence_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Take top matches based on size
        accumulator_picks = high_confidence_predictions[:min(size, len(high_confidence_predictions))]
        
        # Calculate accumulator confidence (weighted average)
        total_confidence = sum(pick['confidence'] for pick in accumulator_picks)
        weighted_confidence = 0
        
        if accumulator_picks:
            weighted_confidence = round(total_confidence / len(accumulator_picks) * 0.9)  # Apply risk factor
        
        return {
            'size': len(accumulator_picks),
            'picks': accumulator_picks,
            'confidence': min(weighted_confidence, 90),  # Cap at 90% for accumulators
            'timestamp': datetime.now().isoformat()
        }
        
    def generate_accumulators(self, all_predictions):
        """
        Generate various sized accumulators across all sports.
        
        Args:
            all_predictions (dict): Dictionary with sport as key and predictions as value
            
        Returns:
            dict: Various accumulators
        """
        # Combine all predictions into one list
        flat_predictions = []
        for sport, predictions in all_predictions.items():
            flat_predictions.extend(predictions)
        
        # Generate different sized accumulators
        accumulators = {
            'double': self.generate_accumulator(flat_predictions, size=2, min_confidence=70),
            'treble': self.generate_accumulator(flat_predictions, size=3, min_confidence=70),
            'five_fold': self.generate_accumulator(flat_predictions, size=5, min_confidence=65),
            'ten_fold': self.generate_accumulator(flat_predictions, size=10, min_confidence=60)
        }
        
        return accumulators

# Example usage
if __name__ == "__main__":
    predictor = Predictor()
    # This would use real trained models and data in a production system
    # Here we're just demonstrating the class structure