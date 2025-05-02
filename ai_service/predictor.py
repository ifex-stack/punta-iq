"""
Prediction module for the AI Sports Prediction service.
Uses machine learning models to predict match outcomes.
"""
import os
import logging
import pickle
import json
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import time
import xgboost as xgb

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('predictor')

class Predictor:
    """Class to generate predictions using ML models."""
    
    def __init__(self):
        """Initialize the Predictor."""
        # Load ML models
        self.models = {}
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk."""
        try:
            models_dir = os.path.join(os.path.dirname(__file__), 'models')
            
            if not os.path.exists(models_dir):
                logger.warning("Models directory not found. Creating models directory and using statistical predictions.")
                os.makedirs(models_dir)
                return
            
            # Enhanced Football models with more prediction types
            football_models = {
                "1X2": "football_1X2.pkl",
                "BTTS": "football_BTTS.pkl",
                "Over_Under": "football_Over_Under.pkl",
                "Correct_Score": "football_Correct_Score.pkl",
                "First_Half": "football_First_Half.pkl",
                "Cards": "football_Cards.pkl"
            }
            
            # Enhanced Basketball models
            basketball_models = {
                "Winner": "basketball_Winner.pkl",
                "Total_Points": "basketball_Total_Points.pkl",
                "Handicap": "basketball_Handicap.pkl",
                "Quarter_Scores": "basketball_Quarter_Scores.pkl",
                "Player_Props": "basketball_Player_Props.pkl"
            }
            
            # Load football models with calibration data for confidence
            self.models["football"] = {}
            self.calibrators = {"football": {}}
            
            for prediction_type, model_file in football_models.items():
                model_path = os.path.join(models_dir, model_file)
                calibrator_path = os.path.join(models_dir, f"calibrator_{prediction_type}.pkl")
                
                if os.path.exists(model_path):
                    try:
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                            self.models["football"][prediction_type] = model
                            logger.info(f"Loaded football {prediction_type} model")
                            
                        # Load calibrator if exists (for better confidence scoring)
                        if os.path.exists(calibrator_path):
                            with open(calibrator_path, 'rb') as f:
                                calibrator = pickle.load(f)
                                self.calibrators["football"][prediction_type] = calibrator
                                logger.info(f"Loaded football {prediction_type} calibrator")
                    except Exception as e:
                        logger.error(f"Error loading football {prediction_type} model: {e}")
            
            # Load basketball models with calibration data
            self.models["basketball"] = {}
            self.calibrators = {"basketball": {}}
            
            for prediction_type, model_file in basketball_models.items():
                model_path = os.path.join(models_dir, model_file)
                calibrator_path = os.path.join(models_dir, f"calibrator_{prediction_type}.pkl")
                
                if os.path.exists(model_path):
                    try:
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                            self.models["basketball"][prediction_type] = model
                            logger.info(f"Loaded basketball {prediction_type} model")
                            
                        # Load calibrator if exists
                        if os.path.exists(calibrator_path):
                            with open(calibrator_path, 'rb') as f:
                                calibrator = pickle.load(f)
                                self.calibrators["basketball"][prediction_type] = calibrator
                                logger.info(f"Loaded basketball {prediction_type} calibrator")
                    except Exception as e:
                        logger.error(f"Error loading basketball {prediction_type} model: {e}")
            
            # Tracking model performance
            self.model_performance = {
                "football": {
                    "predictions_made": 0,
                    "correct_predictions": 0,
                    "total_confidence": 0,
                    "last_updated": datetime.now().isoformat()
                },
                "basketball": {
                    "predictions_made": 0,
                    "correct_predictions": 0,
                    "total_confidence": 0,
                    "last_updated": datetime.now().isoformat()
                }
            }
            
            logger.info(f"Loaded {len(self.models.get('football', {}))} football models and {len(self.models.get('basketball', {}))} basketball models")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def _save_model(self, sport, prediction_type, model):
        """Save trained model to disk."""
        try:
            models_dir = os.path.join(os.path.dirname(__file__), 'models')
            
            if not os.path.exists(models_dir):
                os.makedirs(models_dir)
            
            model_file = f"{sport}_{prediction_type}.pkl"
            model_path = os.path.join(models_dir, model_file)
            
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            
            logger.info(f"Saved {sport} {prediction_type} model")
            return True
            
        except Exception as e:
            logger.error(f"Error saving {sport} {prediction_type} model: {e}")
            return False
    
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
            logger.info(f"Training football model with {len(historical_data)} samples using {model_type}")
            
            # Prepare features and target
            X = historical_data[['home_rank', 'away_rank', 'home_form', 'away_form', 
                             'home_goals_for', 'home_goals_against', 
                             'away_goals_for', 'away_goals_against']]
            
            # Train 1X2 model
            y_1x2 = historical_data['result']
            
            if model_type == "random_forest":
                model_1x2 = RandomForestClassifier(n_estimators=100, random_state=42)
            elif model_type == "gradient_boosting":
                model_1x2 = GradientBoostingClassifier(n_estimators=100, random_state=42)
            elif model_type == "xgboost":
                model_1x2 = xgb.XGBClassifier(n_estimators=100, random_state=42)
            else:
                logger.error(f"Unsupported model type: {model_type}")
                return False
            
            model_1x2.fit(X, y_1x2)
            self._save_model("football", "1X2", model_1x2)
            
            # Store model in memory
            if "football" not in self.models:
                self.models["football"] = {}
            self.models["football"]["1X2"] = model_1x2
            
            # Train BTTS model
            y_btts = historical_data['btts']
            model_btts = GradientBoostingClassifier(n_estimators=100, random_state=42)
            model_btts.fit(X, y_btts)
            self._save_model("football", "BTTS", model_btts)
            self.models["football"]["BTTS"] = model_btts
            
            # Train Over/Under model
            y_over = historical_data['over_2_5']
            model_over = RandomForestClassifier(n_estimators=100, random_state=42)
            model_over.fit(X, y_over)
            self._save_model("football", "Over_Under", model_over)
            self.models["football"]["Over_Under"] = model_over
            
            logger.info("Football models trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error training football model: {e}")
            return False
    
    def predict_football_match(self, match_data):
        """
        Generate predictions for a football match.
        
        Args:
            match_data (dict): Match data including team stats
            
        Returns:
            dict: Prediction results for various markets
        """
        try:
            # Check if we have models
            if "football" not in self.models or not self.models["football"]:
                return self._statistical_football_prediction(match_data)
            
            # Extract features
            home_team = match_data['homeTeam']
            away_team = match_data['awayTeam']
            
            # Convert form to numeric value (W=3, D=1, L=0)
            home_form = home_team.get('form', '')
            away_form = away_team.get('form', '')
            
            home_form_value = sum(3 if res == 'W' else 1 if res == 'D' else 0 for res in home_form)
            away_form_value = sum(3 if res == 'W' else 1 if res == 'D' else 0 for res in away_form)
            
            # Use rankings as proxy for goals data
            home_rank = home_team.get('ranking', 10)
            away_rank = away_team.get('ranking', 10)
            
            # Invert rankings (lower rank = better team)
            home_rank_inv = 21 - home_rank
            away_rank_inv = 21 - away_rank
            
            # Generate features
            home_goals_for = home_rank_inv * 2  # Proxy: better rank = more goals scored
            home_goals_against = (21 - home_rank_inv)  # Proxy: worse rank = more goals conceded
            away_goals_for = away_rank_inv * 1.8  # Away teams score slightly less
            away_goals_against = (21 - away_rank_inv) * 1.2  # Away teams concede slightly more
            
            # Create feature array
            X = np.array([[
                home_rank, 
                away_rank, 
                home_form_value, 
                away_form_value, 
                home_goals_for, 
                home_goals_against, 
                away_goals_for, 
                away_goals_against
            ]])
            
            # Get odds from match data
            odds = match_data.get('odds', {})
            home_odds = odds.get('home', 2.0)
            draw_odds = odds.get('draw', 3.5)
            away_odds = odds.get('away', 4.0)
            
            # 1X2 prediction
            model_1x2 = self.models["football"].get("1X2")
            if model_1x2:
                result_probs = model_1x2.predict_proba(X)[0]
                result_classes = model_1x2.classes_
                
                # Map probabilities to outcomes
                home_prob = 0.0
                draw_prob = 0.0
                away_prob = 0.0
                
                for i, cls in enumerate(result_classes):
                    if cls == 'H':
                        home_prob = result_probs[i]
                    elif cls == 'D':
                        draw_prob = result_probs[i]
                    elif cls == 'A':
                        away_prob = result_probs[i]
                
                # Determine predicted outcome
                predicted_outcome = 'H' if home_prob > max(draw_prob, away_prob) else 'D' if draw_prob > away_prob else 'A'
                
                # Convert probabilities to confidence
                confidence = max(home_prob, draw_prob, away_prob) * 100
                
                # Check for value bet
                value_bet = self._calculate_value_bet(
                    predicted_result=predicted_outcome,
                    home_prob=home_prob,
                    draw_prob=draw_prob,
                    away_prob=away_prob,
                    odds={
                        'H': home_odds,
                        'D': draw_odds,
                        'A': away_odds
                    }
                )
                
                # BTTS prediction
                btts_model = self.models["football"].get("BTTS")
                btts_prob = 0.5
                btts_outcome = "No"
                
                if btts_model:
                    btts_pred = btts_model.predict(X)[0]
                    btts_prob = btts_model.predict_proba(X)[0][1] if 1 in btts_model.classes_ else 0.5
                    btts_outcome = "Yes" if btts_pred == 1 else "No"
                
                # Over/Under prediction
                over_model = self.models["football"].get("Over_Under")
                over_prob = 0.5
                over_outcome = "Under"
                
                if over_model:
                    over_pred = over_model.predict(X)[0]
                    over_prob = over_model.predict_proba(X)[0][1] if 1 in over_model.classes_ else 0.5
                    over_outcome = "Over" if over_pred == 1 else "Under"
                
                # Generate correct score prediction based on model outputs
                if predicted_outcome == 'H':
                    # Home win
                    if over_outcome == "Over":
                        if btts_outcome == "Yes":
                            # High scoring, both teams score
                            home_score = random.choice([2, 3])
                            away_score = random.choice([1])
                        else:
                            # High scoring, away doesn't score
                            home_score = random.choice([3, 4])
                            away_score = 0
                    else:
                        if btts_outcome == "Yes":
                            # Low scoring, both teams score
                            home_score = random.choice([2])
                            away_score = 1
                        else:
                            # Low scoring, away doesn't score
                            home_score = random.choice([1, 2])
                            away_score = 0
                elif predicted_outcome == 'D':
                    # Draw
                    if over_outcome == "Over":
                        # High scoring draw
                        home_score = away_score = random.choice([2, 3])
                    else:
                        # Low scoring draw
                        home_score = away_score = random.choice([0, 1])
                else:
                    # Away win
                    if over_outcome == "Over":
                        if btts_outcome == "Yes":
                            # High scoring, both teams score
                            home_score = random.choice([1])
                            away_score = random.choice([2, 3])
                        else:
                            # High scoring, home doesn't score
                            home_score = 0
                            away_score = random.choice([3, 4])
                    else:
                        if btts_outcome == "Yes":
                            # Low scoring, both teams score
                            home_score = 1
                            away_score = random.choice([2])
                        else:
                            # Low scoring, home doesn't score
                            home_score = 0
                            away_score = random.choice([1, 2])
                
                correct_score = f"{home_score}-{away_score}"
                
                # Prepare prediction result
                prediction = {
                    "id": f"pred-{match_data['id']}",
                    "matchId": match_data['id'],
                    "sport": "football",
                    "createdAt": datetime.now().isoformat(),
                    "homeTeam": home_team['name'],
                    "awayTeam": away_team['name'],
                    "startTime": match_data['startTime'],
                    "league": match_data['league']['name'],
                    "predictedOutcome": predicted_outcome,
                    "confidence": round(confidence, 2),
                    "isPremium": confidence > 80,  # High confidence predictions are premium
                    "valueBet": value_bet,
                    "predictions": {
                        "1X2": {
                            "outcome": predicted_outcome,
                            "homeWin": {
                                "probability": round(home_prob * 100, 2),
                                "odds": home_odds
                            },
                            "draw": {
                                "probability": round(draw_prob * 100, 2),
                                "odds": draw_odds
                            },
                            "awayWin": {
                                "probability": round(away_prob * 100, 2),
                                "odds": away_odds
                            }
                        },
                        "BTTS": {
                            "outcome": btts_outcome,
                            "probability": round(btts_prob * 100, 2)
                        },
                        "Over_Under": {
                            "line": 2.5,
                            "outcome": over_outcome,
                            "probability": round(over_prob * 100, 2)
                        },
                        "CorrectScore": {
                            "outcome": correct_score,
                            "probability": round(confidence * 0.3, 2)  # Correct score is less certain
                        }
                    }
                }
                
                return prediction
            else:
                # Fallback to statistical prediction if no 1X2 model
                return self._statistical_football_prediction(match_data)
        
        except Exception as e:
            logger.error(f"Error making football prediction: {e}")
            # Fallback to statistical prediction
            return self._statistical_football_prediction(match_data)
    
    def _statistical_football_prediction(self, match_data):
        """Generate football predictions using statistical approach."""
        try:
            # Extract team data
            home_team = match_data['homeTeam']
            away_team = match_data['awayTeam']
            
            home_rank = home_team.get('ranking', 10)
            away_rank = away_team.get('ranking', 10)
            
            # Convert form to numeric value (W=3, D=1, L=0)
            home_form = home_team.get('form', 'WDLWW')
            away_form = away_team.get('form', 'WDLWW')
            
            home_form_value = sum(3 if res == 'W' else 1 if res == 'D' else 0 for res in home_form)
            away_form_value = sum(3 if res == 'W' else 1 if res == 'D' else 0 for res in away_form)
            
            # Calculate team strengths
            home_strength = (21 - home_rank) * 1.2 + home_form_value / 5  # Better rank (lower number) = higher strength
            away_strength = (21 - away_rank) + away_form_value / 5
            
            # Add home advantage
            home_strength *= 1.3
            
            # Calculate probabilities
            total_strength = home_strength + away_strength
            home_prob = home_strength / total_strength
            away_prob = away_strength / total_strength
            draw_prob = 1 - home_prob - away_prob
            
            # Ensure reasonable draw probability
            if draw_prob < 0.15:
                adjustment = 0.15 - draw_prob
                home_prob -= adjustment * (home_prob / (home_prob + away_prob))
                away_prob -= adjustment * (away_prob / (home_prob + away_prob))
                draw_prob = 0.15
            
            # Get odds from match data
            odds = match_data.get('odds', {})
            home_odds = odds.get('home', 2.0)
            draw_odds = odds.get('draw', 3.5)
            away_odds = odds.get('away', 4.0)
            
            # Determine predicted outcome
            predicted_outcome = 'H' if home_prob > max(draw_prob, away_prob) else 'D' if draw_prob > away_prob else 'A'
            
            # Convert probabilities to confidence
            confidence = max(home_prob, draw_prob, away_prob) * 100
            
            # Check for value bet
            value_bet = self._calculate_value_bet(
                predicted_result=predicted_outcome,
                home_prob=home_prob,
                draw_prob=draw_prob,
                away_prob=away_prob,
                odds={
                    'H': home_odds,
                    'D': draw_odds,
                    'A': away_odds
                }
            )
            
            # BTTS probability based on team ranks
            btts_prob = 0.5
            if abs(home_rank - away_rank) < 5:
                # Teams of similar quality more likely to both score
                btts_prob = 0.65
            elif min(home_rank, away_rank) < 5:
                # At least one top team playing
                btts_prob = 0.7
            elif max(home_rank, away_rank) > 15:
                # At least one weak team playing
                btts_prob = 0.4
            
            btts_outcome = "Yes" if btts_prob > 0.5 else "No"
            
            # Over/Under probability
            over_prob = 0.5
            if home_rank < 5 and away_rank > 15:
                # Top team vs weak team - likely high scoring
                over_prob = 0.7
            elif home_rank < 10 and away_rank < 10:
                # Two good teams - could be tactical
                over_prob = 0.55
            elif home_rank > 15 and away_rank > 15:
                # Two weak teams - may lack quality
                over_prob = 0.45
            
            over_outcome = "Over" if over_prob > 0.5 else "Under"
            
            from scipy.stats import poisson
            
            # Expected goals based on team strengths
            home_xg = max(0.5, home_strength / 10)
            away_xg = max(0.3, away_strength / 12)  # Away teams score less
            
            # Calculate correct score probabilities using Poisson distribution
            max_goals = 5
            score_probs = {}
            
            for h in range(max_goals + 1):
                for a in range(max_goals + 1):
                    home_prob = poisson.pmf(h, home_xg)
                    away_prob = poisson.pmf(a, away_xg)
                    score_probs[f"{h}-{a}"] = home_prob * away_prob
            
            # Find most likely correct score
            correct_score = max(score_probs, key=score_probs.get)
            correct_score_prob = score_probs[correct_score] * 100
            
            # Prepare prediction result
            prediction = {
                "id": f"pred-{match_data['id']}",
                "matchId": match_data['id'],
                "sport": "football",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": home_team['name'],
                "awayTeam": away_team['name'],
                "startTime": match_data['startTime'],
                "league": match_data['league']['name'],
                "predictedOutcome": predicted_outcome,
                "confidence": round(confidence, 2),
                "isPremium": confidence > 80,  # High confidence predictions are premium
                "valueBet": value_bet,
                "predictions": {
                    "1X2": {
                        "outcome": predicted_outcome,
                        "homeWin": {
                            "probability": round(home_prob * 100, 2),
                            "odds": home_odds
                        },
                        "draw": {
                            "probability": round(draw_prob * 100, 2),
                            "odds": draw_odds
                        },
                        "awayWin": {
                            "probability": round(away_prob * 100, 2),
                            "odds": away_odds
                        }
                    },
                    "BTTS": {
                        "outcome": btts_outcome,
                        "probability": round(btts_prob * 100, 2)
                    },
                    "Over_Under": {
                        "line": 2.5,
                        "outcome": over_outcome,
                        "probability": round(over_prob * 100, 2)
                    },
                    "CorrectScore": {
                        "outcome": correct_score,
                        "probability": round(correct_score_prob, 2)
                    }
                }
            }
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error in statistical football prediction: {e}")
            
            # Even more basic fallback
            return {
                "id": f"pred-{match_data['id']}",
                "matchId": match_data['id'],
                "sport": "football",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": match_data['homeTeam']['name'],
                "awayTeam": match_data['awayTeam']['name'],
                "startTime": match_data['startTime'],
                "league": match_data['league']['name'],
                "predictedOutcome": "H",  # Default to home win
                "confidence": 60.0,
                "isPremium": False,
                "valueBet": None,
                "predictions": {
                    "1X2": {
                        "outcome": "H",
                        "homeWin": {"probability": 60.0, "odds": 1.8},
                        "draw": {"probability": 25.0, "odds": 3.5},
                        "awayWin": {"probability": 15.0, "odds": 4.5}
                    }
                }
            }
    
    def _calculate_confidence_score(self, probabilities, odds=None, historical_success_rate=None):
        """
        Calculate a more sophisticated confidence score based on multiple factors.
        
        Args:
            probabilities (dict): Outcome probabilities from the model
            odds (dict, optional): Bookmaker odds for the outcomes
            historical_success_rate (float, optional): Historical success rate for this type of prediction
            
        Returns:
            tuple: (confidence_score, confidence_level, explanation)
        """
        try:
            # Get the highest probability
            max_prob = max(probabilities.values())
            
            # Base confidence starts with the probability
            confidence = max_prob * 100
            
            # Factors that affect confidence
            certainty_factor = 1.0
            
            # 1. Margin between highest and second highest probability
            sorted_probs = sorted(probabilities.values(), reverse=True)
            if len(sorted_probs) > 1:
                margin = sorted_probs[0] - sorted_probs[1]
                # Higher margin increases confidence
                margin_factor = 1 + (margin * 2)  # Up to 1.5x multiplier
                certainty_factor *= margin_factor
            
            # 2. Agreement with bookmaker odds (if available)
            if odds:
                # Convert odds to implied probabilities
                implied_probs = {k: 1/v for k, v in odds.items()}
                # Normalize (bookies overround)
                total_implied = sum(implied_probs.values())
                implied_probs = {k: v/total_implied for k, v in implied_probs.items()}
                
                # Find highest implied probability
                highest_outcome = max(probabilities, key=probabilities.get)
                bookies_highest = max(implied_probs, key=implied_probs.get)
                
                # Agreement with bookmaker increases confidence
                if highest_outcome == bookies_highest:
                    certainty_factor *= 1.2
                else:
                    certainty_factor *= 0.9
                
                # Check if there's significant disagreement between model and bookies
                model_prob = probabilities[highest_outcome]
                bookies_prob = implied_probs.get(highest_outcome, 0)
                disagreement = abs(model_prob - bookies_prob)
                
                if disagreement > 0.2:  # More than 20% difference
                    certainty_factor *= 0.8
            
            # 3. Historical model performance (if available)
            if historical_success_rate:
                certainty_factor *= (0.5 + historical_success_rate/2)  # Scale between 0.5-1.5
            
            # Calculate final confidence score
            adjusted_confidence = min(99.9, confidence * certainty_factor)
            
            # Classify confidence level
            if adjusted_confidence >= 85:
                confidence_level = "very high"
            elif adjusted_confidence >= 70:
                confidence_level = "high"
            elif adjusted_confidence >= 55:
                confidence_level = "medium"
            elif adjusted_confidence >= 40:
                confidence_level = "low"
            else:
                confidence_level = "very low"
            
            # Create explanation for confidence score
            explanation = f"Based on prediction model ({confidence:.1f}%)"
            if odds:
                if highest_outcome == bookies_highest:
                    explanation += f", matches bookmaker expectation"
                else:
                    explanation += f", differs from bookmaker expectation"
            
            if historical_success_rate:
                explanation += f", historical accuracy: {historical_success_rate*100:.1f}%"
            
            return (round(adjusted_confidence, 1), confidence_level, explanation)
            
        except Exception as e:
            logger.error(f"Error calculating confidence score: {e}")
            return (60.0, "medium", "Using baseline confidence score due to calculation error")

    def _calculate_value_bet(self, predicted_result, home_prob, draw_prob, away_prob, odds):
        """Calculate if there's value in the betting odds with tier classification."""
        try:
            outcome_probs = {
                'H': home_prob,
                'D': draw_prob,
                'A': away_prob
            }
            
            # Value exists when: probability > 1/odds
            # The greater the difference, the more value
            values = {}
            for outcome, prob in outcome_probs.items():
                implied_prob = 1 / odds[outcome]
                edge = prob - implied_prob
                value_pct = (edge / implied_prob) * 100 if implied_prob > 0 else 0
                values[outcome] = {
                    "edge": round(edge, 3),
                    "value": round(value_pct, 2),
                    "implied_probability": round(implied_prob * 100, 2),
                    "our_probability": round(prob * 100, 2),
                    "tier": "Tier 10"  # Default lowest tier
                }
                
                # Classify based on edge, value, and odds
                if value_pct > 15 and edge > 0.15:  # Strong value
                    if odds[outcome] < 2.0:
                        values[outcome]["tier"] = "Tier 2"  # Lower odds = Tier 2
                    elif odds[outcome] < 3.5:
                        values[outcome]["tier"] = "Tier 2"  # Medium odds = Tier 2
                    else:
                        values[outcome]["tier"] = "Tier 5"  # Higher odds = Tier 5
                elif value_pct > 10 and edge > 0.1:  # Good value
                    if odds[outcome] < 2.5:
                        values[outcome]["tier"] = "Tier 2"  # Lower odds = Tier 2
                    elif odds[outcome] < 4.0:
                        values[outcome]["tier"] = "Tier 5"  # Medium odds = Tier 5
                    else:
                        values[outcome]["tier"] = "Tier 10"  # Higher odds = Tier 10 (speculative)
                elif value_pct > 5 and edge > 0.05:  # Some value
                    if odds[outcome] < 3.0:
                        values[outcome]["tier"] = "Tier 5"  # Lower odds = Tier 5
                    else:
                        values[outcome]["tier"] = "Tier 10"  # Higher odds = Tier 10
                
                # Exceptional value on strong favorites can be Tier 1
                if value_pct > 20 and edge > 0.2 and odds[outcome] < 1.8:
                    values[outcome]["tier"] = "Tier 1"
            
            # Find best value
            best_value = max(values.items(), key=lambda x: x[1]["value"])
            outcome, value_data = best_value
            
            if value_data["value"] > 5:  # At least 5% value to return anything
                return {
                    "outcome": outcome,
                    "odds": odds[outcome],
                    "value": value_data["value"],
                    "edge": value_data["edge"],
                    "tier": value_data["tier"],
                    "isRecommended": value_data["value"] > 10
                }
            
            # If predicted outcome has any positive value, still show it
            if values[predicted_result]["value"] > 0:
                return {
                    "outcome": predicted_result,
                    "odds": odds[predicted_result],
                    "value": values[predicted_result]["value"],
                    "edge": values[predicted_result]["edge"],
                    "tier": values[predicted_result]["tier"],
                    "isRecommended": False
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error calculating value bet: {e}")
            return None
    
    def predict_basketball_game(self, game_data):
        """
        Generate predictions for a basketball game.
        
        Args:
            game_data (dict): Game data including team stats
            
        Returns:
            dict: Prediction results for various markets
        """
        try:
            # Extract team data
            home_team = game_data['homeTeam']
            away_team = game_data['awayTeam']
            
            home_rank = home_team.get('ranking', 8)
            away_rank = away_team.get('ranking', 8)
            
            # Convert form to numeric value (W=1, L=0)
            home_form = home_team.get('form', '')
            away_form = away_team.get('form', '')
            
            home_form_value = sum(1 if res == 'W' else 0 for res in home_form)
            away_form_value = sum(1 if res == 'W' else 0 for res in away_form)
            
            # Get offensive and defensive ratings if available
            home_offense = home_team.get('offense', 110)
            home_defense = home_team.get('defense', 105)
            away_offense = away_team.get('offense', 108)
            away_defense = away_team.get('defense', 107)
            
            # Calculate team strengths
            home_strength = (16 - home_rank) + home_form_value / 5 + (home_offense - home_defense) / 10
            away_strength = (16 - away_rank) + away_form_value / 5 + (away_offense - away_defense) / 10
            
            # Add home advantage
            home_strength *= 1.2
            
            # Calculate winner probabilities
            total_strength = home_strength + away_strength
            home_prob = home_strength / total_strength
            away_prob = 1 - home_prob
            
            # Get odds from game data
            odds = game_data.get('odds', {})
            home_odds = odds.get('home', 1.8)
            away_odds = odds.get('away', 2.2)
            
            # Determine predicted outcome
            predicted_outcome = 'H' if home_prob > away_prob else 'A'
            
            # Convert probabilities to confidence
            confidence = max(home_prob, away_prob) * 100
            
            # Check for value bet
            value_bet = None
            if 1 / home_odds < home_prob:
                home_value = (home_prob - (1 / home_odds)) * 100
                value_bet = {
                    "outcome": "H",
                    "odds": home_odds,
                    "value": round(home_value, 2),
                    "isRecommended": home_value > 5
                }
            elif 1 / away_odds < away_prob:
                away_value = (away_prob - (1 / away_odds)) * 100
                value_bet = {
                    "outcome": "A",
                    "odds": away_odds,
                    "value": round(away_value, 2),
                    "isRecommended": away_value > 5
                }
            
            # Calculate over/under line and probability
            league = game_data['league']['name']
            over_under_line = 220.5 if league == "NBA" else 160.5
            
            # Calculate expected points
            home_points = (home_offense - away_defense) + (50 if league == "NBA" else 35)
            away_points = (away_offense - home_defense) + (45 if league == "NBA" else 32)
            total_points = home_points + away_points
            
            over_prob = 0.5
            if total_points > over_under_line:
                over_prob = 0.65
            else:
                over_prob = 0.35
            
            over_outcome = "Over" if over_prob > 0.5 else "Under"
            
            # Calculate spread
            spread = home_points - away_points
            if spread > 0:
                spread_line = round(spread / 2)  # Conservative spread
                spread_side = "H"
            else:
                spread_line = round(abs(spread) / 2)
                spread_side = "A"
            
            # Prepare prediction result
            prediction = {
                "id": f"pred-{game_data['id']}",
                "matchId": game_data['id'],
                "sport": "basketball",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": home_team['name'],
                "awayTeam": away_team['name'],
                "startTime": game_data['startTime'],
                "league": game_data['league']['name'],
                "predictedOutcome": predicted_outcome,
                "confidence": round(confidence, 2),
                "isPremium": confidence > 75,  # High confidence predictions are premium
                "valueBet": value_bet,
                "predictions": {
                    "Winner": {
                        "outcome": predicted_outcome,
                        "homeWin": {
                            "probability": round(home_prob * 100, 2),
                            "odds": home_odds
                        },
                        "awayWin": {
                            "probability": round(away_prob * 100, 2),
                            "odds": away_odds
                        }
                    },
                    "TotalPoints": {
                        "line": over_under_line,
                        "outcome": over_outcome,
                        "probability": round(over_prob * 100, 2),
                        "predictedTotal": round(total_points, 1)
                    },
                    "Spread": {
                        "line": spread_line,
                        "favored": spread_side,
                        "probability": 60.0
                    },
                    "PredictedScore": {
                        "home": round(home_points),
                        "away": round(away_points)
                    }
                }
            }
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error making basketball prediction: {e}")
            
            # Fallback to basic prediction
            return {
                "id": f"pred-{game_data['id']}",
                "matchId": game_data['id'],
                "sport": "basketball",
                "createdAt": datetime.now().isoformat(),
                "homeTeam": game_data['homeTeam']['name'],
                "awayTeam": game_data['awayTeam']['name'],
                "startTime": game_data['startTime'],
                "league": game_data['league']['name'],
                "predictedOutcome": "H",  # Default to home win
                "confidence": 60.0,
                "isPremium": False,
                "valueBet": None,
                "predictions": {
                    "Winner": {
                        "outcome": "H",
                        "homeWin": {"probability": 60.0, "odds": 1.6},
                        "awayWin": {"probability": 40.0, "odds": 2.4}
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
            # Generate prediction for each match
            for match in matches_data:
                # Slight delay to avoid overwhelming system resources
                time.sleep(0.01)
                
                try:
                    if sport == "football":
                        prediction = self.predict_football_match(match)
                    elif sport == "basketball":
                        prediction = self.predict_basketball_game(match)
                    else:
                        logger.warning(f"Unsupported sport: {sport}")
                        continue
                    
                    predictions.append(prediction)
                    
                except Exception as e:
                    logger.error(f"Error predicting {sport} match {match.get('id', 'unknown')}: {e}")
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error predicting {sport} matches: {e}")
            return []
    
    def generate_accumulator(self, predictions, size=2, min_confidence=75, target_tier="Tier 10"):
        """
        Generate accumulator predictions based on highest confidence matches and tier classification.
        
        Args:
            predictions (list): List of match predictions
            size (int): Number of matches to include in accumulator
            min_confidence (int): Minimum confidence threshold
            target_tier (str): Target tier level for accumulator (Tier 1, 2, 5, or 10)
            
        Returns:
            dict: Accumulator prediction
        """
        try:
            # Filter predictions by confidence
            confident_predictions = [p for p in predictions if p.get('confidence', 0) >= min_confidence]
            
            # Filter by value bets if target tier is specified
            if target_tier != "Tier 10":
                with_value = []
                for pred in confident_predictions:
                    value_bet = pred.get('valueBet', {})
                    if value_bet and value_bet.get('tier', 'Tier 10') == target_tier:
                        with_value.append(pred)
                
                if with_value:
                    confident_predictions = with_value
            
            # Sort by confidence (highest first)
            confident_predictions.sort(key=lambda x: x.get('confidence', 0), reverse=True)
            
            # Take top 'size' predictions
            top_predictions = confident_predictions[:size]
            
            if len(top_predictions) < size:
                # Try to relax confidence threshold
                logger.warning(f"Not enough predictions for {target_tier} accumulator (size {size}), relaxing criteria")
                
                # If targeting tier 1 or 2, fall back to tier 5
                if target_tier in ["Tier 1", "Tier 2"] and target_tier != "Tier 5":
                    return self.generate_accumulator(predictions, size, min_confidence-5, "Tier 5")
                # If targeting tier 5, fall back to tier 10
                elif target_tier == "Tier 5":
                    return self.generate_accumulator(predictions, size, min_confidence-5, "Tier 10")
                # If already at tier 10, reduce confidence threshold
                elif target_tier == "Tier 10" and min_confidence > 60:
                    return self.generate_accumulator(predictions, size, min_confidence-10, "Tier 10")
                else:
                    logger.warning(f"Failed to generate {target_tier} accumulator of size {size}")
                    return None
            
            # Calculate accumulator odds and total confidence
            acca_odds = 1.0
            total_confidence = 0.0
            total_value = 0.0
            total_edge = 0.0
            
            selections = []
            for pred in top_predictions:
                outcome = pred.get('predictedOutcome')
                sport = pred.get('sport', 'football')
                match_odds = pred.get('predictions', {})
                value_bet = pred.get('valueBet', {})
                
                # Get odds based on predicted outcome or value bet if available
                odds = None
                if value_bet and target_tier != "Tier 10":
                    if value_bet.get('tier', 'Tier 10') == target_tier:
                        outcome = value_bet.get('outcome')
                        odds = value_bet.get('odds')
                
                if odds is None:
                    if sport == "football":
                        market = match_odds.get('1X2', {})
                        if outcome == 'H':
                            odds = market.get('homeWin', {}).get('odds', 2.0)
                        elif outcome == 'D':
                            odds = market.get('draw', {}).get('odds', 3.5)
                        else:  # 'A'
                            odds = market.get('awayWin', {}).get('odds', 4.0)
                    else:  # basketball
                        market = match_odds.get('Winner', {})
                        if outcome == 'H':
                            odds = market.get('homeWin', {}).get('odds', 1.8)
                        else:  # 'A'
                            odds = market.get('awayWin', {}).get('odds', 2.2)
                
                acca_odds *= odds
                total_confidence += pred.get('confidence', 0)
                
                # Track value metrics
                if value_bet:
                    total_value += value_bet.get('value', 0)
                    total_edge += value_bet.get('edge', 0)
                
                # Determine confidence explanation
                confidence_explanation = ""
                if pred.get('confidence_explanation'):
                    confidence_explanation = pred.get('confidence_explanation')
                elif value_bet and value_bet.get('value', 0) > 10:
                    confidence_explanation = f"Value bet with {value_bet.get('value')}% edge over market odds"
                
                # Create selection object
                selection = {
                    "matchId": pred.get('matchId'),
                    "homeTeam": pred.get('homeTeam'),
                    "awayTeam": pred.get('awayTeam'),
                    "league": pred.get('league'),
                    "startTime": pred.get('startTime'),
                    "sport": pred.get('sport'),
                    "market": "1X2" if sport == "football" else "Winner",
                    "outcome": outcome,
                    "odds": odds,
                    "confidence": pred.get('confidence'),
                    "confidence_explanation": confidence_explanation,
                    "tier": value_bet.get('tier', 'Tier 10') if value_bet else 'Tier 10'
                }
                
                selections.append(selection)
            
            # Classify accumulator tier based on individual selections
            acca_tier = "Tier 10"  # Default
            if all(s.get('tier', 'Tier 10') == 'Tier 1' for s in selections):
                acca_tier = "Tier 1"
            elif all(s.get('tier', 'Tier 10') in ['Tier 1', 'Tier 2'] for s in selections):
                acca_tier = "Tier 2"
            elif all(s.get('tier', 'Tier 10') in ['Tier 1', 'Tier 2', 'Tier 5'] for s in selections):
                acca_tier = "Tier 5"
            
            # If target tier specified, use that as an override
            if target_tier != "Tier 10":
                acca_tier = target_tier
            
            # Create accumulator object
            accumulator = {
                "id": f"acca-{size}-{target_tier}-{int(time.time())}",
                "createdAt": datetime.now().isoformat(),
                "size": size,
                "tier": acca_tier,
                "totalOdds": round(acca_odds, 2),
                "confidence": round(total_confidence / len(top_predictions), 2),
                "averageValue": round(total_value / len(selections), 2) if total_value > 0 else 0,
                "averageEdge": round(total_edge / len(selections), 3) if total_edge > 0 else 0,
                "selections": selections,
                "isPremium": acca_tier in ["Tier 1", "Tier 2"] or acca_odds > 10.0
            }
            
            return accumulator
            
        except Exception as e:
            logger.error(f"Error generating accumulator: {e}")
            return None
    
    def generate_accumulators(self, all_predictions):
        """
        Generate various sized accumulators across all sports with tier classification.
        
        Args:
            all_predictions (dict): Dictionary with sport as key and predictions as value
            
        Returns:
            dict: Various accumulators organized by size and tier
        """
        accumulators = {
            "tier1": [],  # Premium, highest confidence (Tier 1)
            "tier2": [],  # Premium, high confidence (Tier 2)
            "tier5": [],  # Standard, medium confidence (Tier 5)
            "tier10": [], # Free, lowest confidence (Tier 10)
            
            # Legacy categorization for backward compatibility
            "small": [],
            "medium": [],
            "large": [],
            "mega": []
        }
        
        try:
            # Combine all predictions
            combined_predictions = []
            for sport, predictions in all_predictions.items():
                combined_predictions.extend(predictions)
            
            # Tier 1 accumulators (premium, highest confidence, focus on value)
            # Usually 2-3 selections with very strong value
            acca = self.generate_accumulator(combined_predictions, size=2, min_confidence=85, target_tier="Tier 1")
            if acca:
                accumulators["tier1"].append(acca)
                accumulators["small"].append(acca) # For backwards compatibility
            
            acca = self.generate_accumulator(combined_predictions, size=3, min_confidence=80, target_tier="Tier 1")
            if acca:
                accumulators["tier1"].append(acca)
                accumulators["small"].append(acca)
            
            # Tier 2 accumulators (premium, high confidence)
            # Usually 2-4 selections with good value
            for size in [2, 3, 4]:
                acca = self.generate_accumulator(combined_predictions, size=size, min_confidence=75, target_tier="Tier 2")
                if acca:
                    accumulators["tier2"].append(acca)
                    if size <= 3:
                        accumulators["small"].append(acca)
                    else:
                        accumulators["medium"].append(acca)
            
            # Tier 5 accumulators (standard, medium confidence)
            # Usually 3-6 selections with reasonable value
            for size in [3, 4, 5, 6]:
                acca = self.generate_accumulator(combined_predictions, size=size, min_confidence=65, target_tier="Tier 5")
                if acca:
                    accumulators["tier5"].append(acca)
                    if size <= 3:
                        accumulators["small"].append(acca)
                    elif size <= 5:
                        accumulators["medium"].append(acca)
                    else:
                        accumulators["large"].append(acca)
            
            # Tier 10 accumulators (free, lower confidence)
            # Usually 4-10 selections, more speculative
            for size in [4, 6, 8, 10]:
                min_conf = 75 if size <= 4 else 65 if size <= 6 else 55 if size <= 8 else 50
                acca = self.generate_accumulator(combined_predictions, size=size, min_confidence=min_conf, target_tier="Tier 10")
                if acca:
                    accumulators["tier10"].append(acca)
                    if size <= 5:
                        accumulators["medium"].append(acca)
                    elif size <= 8:
                        accumulators["large"].append(acca)
                    else:
                        accumulators["mega"].append(acca)
            
            # Track metrics for generated accumulators
            tiers_count = {
                "tier1": len(accumulators["tier1"]),
                "tier2": len(accumulators["tier2"]),
                "tier5": len(accumulators["tier5"]),
                "tier10": len(accumulators["tier10"])
            }
            
            logger.info(f"Generated accumulators by tier: {tiers_count}")
            
            return accumulators
            
        except Exception as e:
            logger.error(f"Error generating accumulators: {e}")
            return accumulators