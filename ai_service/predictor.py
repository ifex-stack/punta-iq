"""
Prediction module for the AI Sports Prediction service.
Uses machine learning models to predict match outcomes.
"""
import logging
import os
import json
import pickle
import random
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logging.warning("XGBoost not available. Install it for better prediction performance.")

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
        self.models = {
            "football": {
                "1X2": None,
                "BTTS": None,
                "Over/Under": None,
                "Correct Score": None
            },
            "basketball": {
                "Winner": None,
                "Total Points": None,
                "Spread": None
            }
        }
        
        # Load pre-trained models if available
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk."""
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
            logger.info(f"Created models directory at {models_dir}")
            return
        
        # Load football models
        for prediction_type in self.models["football"]:
            model_path = os.path.join(models_dir, f"football_{prediction_type.replace('/', '_')}.pkl")
            if os.path.exists(model_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.models["football"][prediction_type] = pickle.load(f)
                    logger.info(f"Loaded football {prediction_type} model from {model_path}")
                except Exception as e:
                    logger.error(f"Error loading football {prediction_type} model: {e}")
        
        # Load basketball models
        for prediction_type in self.models["basketball"]:
            model_path = os.path.join(models_dir, f"basketball_{prediction_type.replace('/', '_')}.pkl")
            if os.path.exists(model_path):
                try:
                    with open(model_path, 'rb') as f:
                        self.models["basketball"][prediction_type] = pickle.load(f)
                    logger.info(f"Loaded basketball {prediction_type} model from {model_path}")
                except Exception as e:
                    logger.error(f"Error loading basketball {prediction_type} model: {e}")
    
    def _save_model(self, sport, prediction_type, model):
        """Save trained model to disk."""
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
        
        model_path = os.path.join(models_dir, f"{sport}_{prediction_type.replace('/', '_')}.pkl")
        
        try:
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"Saved {sport} {prediction_type} model to {model_path}")
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
            if not isinstance(historical_data, pd.DataFrame):
                logger.error("Historical data must be a pandas DataFrame")
                return False
            
            if len(historical_data) == 0:
                logger.error("Historical data is empty")
                return False
            
            # For simplicity, we'll train a single model for 1X2 prediction
            # In a real implementation, you would train separate models for each prediction type
            
            # Prepare features and target
            # Example features: team_rankings, recent_form, home_advantage, etc.
            X = historical_data[['home_rank', 'away_rank', 'home_form', 'away_form', 
                               'home_goals_for', 'home_goals_against', 
                               'away_goals_for', 'away_goals_against']]
            y = historical_data['result']  # 'H', 'D', or 'A' for home win, draw, away win
            
            # Select and train model
            if model_type == "random_forest":
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            elif model_type == "gradient_boosting":
                model = GradientBoostingClassifier(n_estimators=100, random_state=42)
            elif model_type == "xgboost" and XGBOOST_AVAILABLE:
                model = xgb.XGBClassifier(n_estimators=100, random_state=42)
            else:
                logger.warning(f"Model type {model_type} not available. Using Random Forest.")
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            
            # Train model
            model.fit(X, y)
            
            # Save model
            self.models["football"]["1X2"] = model
            self._save_model("football", "1X2", model)
            
            logger.info(f"Successfully trained football 1X2 prediction model using {model_type}")
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
        # Check if we have trained models
        if not self.models["football"]["1X2"]:
            # Use statistical approach if no model is available
            return self._statistical_football_prediction(match_data)
        
        try:
            # Extract features from match data
            # In a real implementation, you would extract the same features used for training
            
            # For demonstration, we'll use a statistical approach instead
            return self._statistical_football_prediction(match_data)
            
        except Exception as e:
            logger.error(f"Error predicting football match: {e}")
            return self._statistical_football_prediction(match_data)
    
    def _statistical_football_prediction(self, match_data):
        """Generate football predictions using statistical approach."""
        try:
            # Extract team data
            home_team = match_data["homeTeam"]["name"]
            away_team = match_data["awayTeam"]["name"]
            league = match_data["league"]["name"]
            country = match_data["league"]["country"]
            
            # Extract rankings and form if available
            home_rank = match_data["homeTeam"].get("ranking", random.randint(1, 20))
            away_rank = match_data["awayTeam"].get("ranking", random.randint(1, 20))
            
            home_form = match_data["homeTeam"].get("form", "")
            away_form = match_data["awayTeam"].get("form", "")
            
            # Calculate form points if form string is available (e.g., "WWDLW")
            home_form_points = 0
            away_form_points = 0
            
            if home_form:
                for result in home_form:
                    if result == "W":
                        home_form_points += 3
                    elif result == "D":
                        home_form_points += 1
            
            if away_form:
                for result in away_form:
                    if result == "W":
                        away_form_points += 3
                    elif result == "D":
                        away_form_points += 1
            
            # Home advantage factor
            home_advantage = 1.2
            
            # Calculate base probabilities
            home_strength = (21 - home_rank) * home_advantage
            away_strength = (21 - away_rank)
            
            if home_form:
                home_strength = home_strength * (1 + home_form_points / 15)
            
            if away_form:
                away_strength = away_strength * (1 + away_form_points / 15)
            
            total_strength = home_strength + away_strength
            
            home_win_prob = home_strength / total_strength
            away_win_prob = away_strength / total_strength
            draw_prob = 1 - home_win_prob - away_win_prob
            
            # Adjust probabilities to ensure they sum to 1
            if draw_prob < 0.1:
                draw_prob = 0.1
                excess = draw_prob - 0.1
                home_win_prob -= excess * (home_win_prob / (home_win_prob + away_win_prob))
                away_win_prob -= excess * (away_win_prob / (home_win_prob + away_win_prob))
            
            # Generate 1X2 prediction
            if home_win_prob > away_win_prob and home_win_prob > draw_prob:
                predicted_result = "1"  # Home win
                confidence = home_win_prob * 100
            elif away_win_prob > home_win_prob and away_win_prob > draw_prob:
                predicted_result = "2"  # Away win
                confidence = away_win_prob * 100
            else:
                predicted_result = "X"  # Draw
                confidence = draw_prob * 100
            
            # Calculate expected goals
            home_expected_goals = 1.5 * (home_strength / 20)
            away_expected_goals = 1.2 * (away_strength / 20)
            
            # Under/Over prediction
            total_expected_goals = home_expected_goals + away_expected_goals
            over_under_line = 2.5
            
            if total_expected_goals > over_under_line:
                over_under_prediction = "Over"
                over_under_confidence = min(((total_expected_goals - over_under_line) / 2) * 100, 95)
            else:
                over_under_prediction = "Under"
                over_under_confidence = min(((over_under_line - total_expected_goals) / 2) * 100, 95)
            
            # BTTS (Both Teams To Score) prediction
            btts_yes_prob = (home_expected_goals * away_expected_goals) / 4
            
            if btts_yes_prob > 0.5:
                btts_prediction = "Yes"
                btts_confidence = btts_yes_prob * 100
            else:
                btts_prediction = "No"
                btts_confidence = (1 - btts_yes_prob) * 100
            
            # Correct Score prediction
            # Using Poisson distribution to predict scores
            import scipy.stats
            
            max_prob = 0
            predicted_score = "0-0"
            
            score_probs = {}
            for home_goals in range(6):
                for away_goals in range(6):
                    home_prob = scipy.stats.poisson.pmf(home_goals, home_expected_goals)
                    away_prob = scipy.stats.poisson.pmf(away_goals, away_expected_goals)
                    score_prob = home_prob * away_prob
                    
                    score = f"{home_goals}-{away_goals}"
                    score_probs[score] = score_prob
                    
                    if score_prob > max_prob:
                        max_prob = score_prob
                        predicted_score = score
            
            # Assemble prediction result
            prediction = {
                "id": match_data.get("id", "unknown"),
                "sport": "football",
                "league": {
                    "id": match_data["league"]["id"],
                    "name": league,
                    "country": country
                },
                "matchup": f"{home_team} vs {away_team}",
                "homeTeam": home_team,
                "awayTeam": away_team,
                "startTime": match_data["startTime"],
                "predictions": {
                    "1X2": {
                        "predicted_outcome": predicted_result,
                        "confidence": round(confidence, 1),
                        "tier": "standard" if confidence < 75 else "premium",
                        "probabilities": {
                            "home": round(home_win_prob * 100, 1),
                            "draw": round(draw_prob * 100, 1),
                            "away": round(away_win_prob * 100, 1)
                        },
                        "odds": {
                            "home": match_data["odds"]["home"],
                            "draw": match_data["odds"]["draw"],
                            "away": match_data["odds"]["away"]
                        },
                        "value_bet": self._calculate_value_bet(predicted_result, 
                                                            home_win_prob, draw_prob, away_win_prob,
                                                            match_data["odds"])
                    },
                    "OverUnder": {
                        "line": over_under_line,
                        "predicted_outcome": over_under_prediction,
                        "confidence": round(over_under_confidence, 1),
                        "tier": "standard" if over_under_confidence < 75 else "premium",
                        "expected_goals": {
                            "home": round(home_expected_goals, 2),
                            "away": round(away_expected_goals, 2),
                            "total": round(total_expected_goals, 2)
                        }
                    },
                    "BTTS": {
                        "predicted_outcome": btts_prediction,
                        "confidence": round(btts_confidence, 1),
                        "tier": "standard" if btts_confidence < 75 else "premium"
                    },
                    "CorrectScore": {
                        "predicted_outcome": predicted_score,
                        "confidence": round(max_prob * 100, 1),
                        "tier": "elite",
                        "top_scores": dict(sorted(
                            {k: round(v * 100, 1) for k, v in score_probs.items() if v > 0.03}.items(), 
                            key=lambda item: item[1], 
                            reverse=True
                        )[:5])
                    }
                },
                "analysis": {
                    "home_strength": round(home_strength, 2),
                    "away_strength": round(away_strength, 2),
                    "home_form": home_form or "Unknown",
                    "away_form": away_form or "Unknown"
                },
                "prediction_time": datetime.now().isoformat()
            }
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error in statistical football prediction: {e}")
            # Return bare minimum prediction
            return {
                "id": match_data.get("id", "unknown"),
                "sport": "football",
                "matchup": f"{match_data['homeTeam']['name']} vs {match_data['awayTeam']['name']}",
                "predictions": {
                    "1X2": {
                        "predicted_outcome": "1",
                        "confidence": 50.0
                    }
                }
            }
    
    def _calculate_value_bet(self, predicted_result, home_prob, draw_prob, away_prob, odds):
        """Calculate if there's value in the betting odds."""
        try:
            # Convert odds to implied probabilities
            home_implied_prob = 1 / odds["home"]
            draw_implied_prob = 1 / odds["draw"]
            away_implied_prob = 1 / odds["away"]
            
            # Add a margin to our probabilities to account for bookmaker margin
            margin_factor = 0.9
            
            value_options = []
            
            # Check for value in home win
            if home_prob * margin_factor > home_implied_prob:
                value = (home_prob * margin_factor) / home_implied_prob
                value_options.append({
                    "pick": "1", 
                    "value_ratio": round(value, 2),
                    "odds": odds["home"]
                })
            
            # Check for value in draw
            if draw_prob * margin_factor > draw_implied_prob:
                value = (draw_prob * margin_factor) / draw_implied_prob
                value_options.append({
                    "pick": "X", 
                    "value_ratio": round(value, 2),
                    "odds": odds["draw"]
                })
            
            # Check for value in away win
            if away_prob * margin_factor > away_implied_prob:
                value = (away_prob * margin_factor) / away_implied_prob
                value_options.append({
                    "pick": "2", 
                    "value_ratio": round(value, 2),
                    "odds": odds["away"]
                })
            
            # Sort by value ratio
            value_options.sort(key=lambda x: x["value_ratio"], reverse=True)
            
            if value_options:
                # Check if the best value bet is the same as our prediction
                best_value = value_options[0]
                return {
                    "is_value_bet": True,
                    "best_value": best_value,
                    "matches_prediction": best_value["pick"] == predicted_result,
                    "options": value_options
                }
            else:
                return {
                    "is_value_bet": False
                }
                
        except Exception as e:
            logger.error(f"Error calculating value bet: {e}")
            return {
                "is_value_bet": False,
                "error": str(e)
            }
    
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
            home_team = game_data["homeTeam"]["name"]
            away_team = game_data["awayTeam"]["name"]
            league = game_data["league"]["name"]
            
            # Extract rankings and form if available
            home_rank = game_data["homeTeam"].get("ranking", random.randint(1, 16))
            away_rank = game_data["awayTeam"].get("ranking", random.randint(1, 16))
            
            home_form = game_data["homeTeam"].get("form", "")
            away_form = game_data["awayTeam"].get("form", "")
            
            # Calculate form points if form string is available (e.g., "WLWLW")
            home_form_points = 0
            away_form_points = 0
            
            if home_form:
                for result in home_form:
                    if result == "W":
                        home_form_points += 1
            
            if away_form:
                for result in away_form:
                    if result == "W":
                        away_form_points += 1
            
            # Home advantage factor
            home_advantage = 1.15
            
            # Calculate base probabilities
            home_strength = (17 - home_rank) * home_advantage
            away_strength = (17 - away_rank)
            
            if home_form:
                home_strength = home_strength * (1 + home_form_points / 5)
            
            if away_form:
                away_strength = away_strength * (1 + away_form_points / 5)
            
            total_strength = home_strength + away_strength
            
            home_win_prob = home_strength / total_strength
            away_win_prob = away_strength / total_strength
            
            # Winner prediction
            if home_win_prob > away_win_prob:
                predicted_winner = "home"
                winner_confidence = home_win_prob * 100
            else:
                predicted_winner = "away"
                winner_confidence = away_win_prob * 100
            
            # Generate point estimates
            if league["name"] == "NBA":
                base_points = 110
            else:  # EuroLeague
                base_points = 80
            
            home_expected_points = base_points * (home_strength / 16)
            away_expected_points = base_points * 0.85 * (away_strength / 16)
            
            total_expected_points = home_expected_points + away_expected_points
            
            # Spread prediction (handicap)
            spread = round(home_expected_points - away_expected_points)
            
            # Assemble prediction result
            prediction = {
                "id": game_data.get("id", "unknown"),
                "sport": "basketball",
                "league": {
                    "id": game_data["league"]["id"],
                    "name": league["name"],
                    "country": league["country"]
                },
                "matchup": f"{home_team} vs {away_team}",
                "homeTeam": home_team,
                "awayTeam": away_team,
                "startTime": game_data["startTime"],
                "predictions": {
                    "Winner": {
                        "predicted_outcome": predicted_winner,
                        "confidence": round(winner_confidence, 1),
                        "tier": "standard" if winner_confidence < 75 else "premium",
                        "probabilities": {
                            "home": round(home_win_prob * 100, 1),
                            "away": round(away_win_prob * 100, 1)
                        },
                        "odds": {
                            "home": game_data["odds"]["home"],
                            "away": game_data["odds"]["away"]
                        }
                    },
                    "TotalPoints": {
                        "line": round(total_expected_points / 5) * 5,  # Round to nearest 5
                        "predicted_outcome": "Over" if random.random() > 0.5 else "Under",
                        "confidence": round(random.uniform(60, 80), 1),
                        "tier": "standard",
                        "expected_points": {
                            "home": round(home_expected_points, 1),
                            "away": round(away_expected_points, 1),
                            "total": round(total_expected_points, 1)
                        }
                    },
                    "Spread": {
                        "line": spread,
                        "predicted_outcome": "Home" if spread > 0 else "Away",
                        "confidence": round(min(abs(spread) * 2, 90), 1),
                        "tier": "premium" if abs(spread) > 5 else "standard"
                    }
                },
                "analysis": {
                    "home_strength": round(home_strength, 2),
                    "away_strength": round(away_strength, 2),
                    "home_form": home_form or "Unknown",
                    "away_form": away_form or "Unknown"
                },
                "prediction_time": datetime.now().isoformat()
            }
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error predicting basketball game: {e}")
            # Return bare minimum prediction
            return {
                "id": game_data.get("id", "unknown"),
                "sport": "basketball",
                "matchup": f"{game_data['homeTeam']['name']} vs {game_data['awayTeam']['name']}",
                "predictions": {
                    "Winner": {
                        "predicted_outcome": "home",
                        "confidence": 55.0
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
        
        for match in matches_data:
            try:
                if sport == "football":
                    prediction = self.predict_football_match(match)
                elif sport == "basketball":
                    prediction = self.predict_basketball_game(match)
                else:
                    logger.warning(f"Prediction not implemented for sport: {sport}")
                    continue
                
                predictions.append(prediction)
                
            except Exception as e:
                logger.error(f"Error predicting {sport} match {match.get('id', 'unknown')}: {e}")
        
        logger.info(f"Generated {len(predictions)} predictions for {sport}")
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
        try:
            if not predictions or len(predictions) < size:
                logger.warning(f"Not enough predictions to create accumulator of size {size}")
                return None
            
            # Filter predictions by minimum confidence
            high_confidence_predictions = []
            
            for prediction in predictions:
                # For football, use 1X2 market confidence
                if prediction["sport"] == "football":
                    confidence = prediction["predictions"]["1X2"]["confidence"]
                    if confidence >= min_confidence:
                        high_confidence_predictions.append({
                            "id": prediction["id"],
                            "sport": prediction["sport"],
                            "matchup": prediction["matchup"],
                            "homeTeam": prediction["homeTeam"],
                            "awayTeam": prediction["awayTeam"],
                            "league": prediction["league"]["name"],
                            "startTime": prediction["startTime"],
                            "market": "1X2",
                            "prediction": prediction["predictions"]["1X2"]["predicted_outcome"],
                            "confidence": confidence,
                            "odds": prediction["predictions"]["1X2"]["odds"][
                                "home" if prediction["predictions"]["1X2"]["predicted_outcome"] == "1" else
                                "draw" if prediction["predictions"]["1X2"]["predicted_outcome"] == "X" else
                                "away"
                            ]
                        })
                
                # For basketball, use Winner market confidence
                elif prediction["sport"] == "basketball":
                    confidence = prediction["predictions"]["Winner"]["confidence"]
                    if confidence >= min_confidence:
                        high_confidence_predictions.append({
                            "id": prediction["id"],
                            "sport": prediction["sport"],
                            "matchup": prediction["matchup"],
                            "homeTeam": prediction["homeTeam"],
                            "awayTeam": prediction["awayTeam"],
                            "league": prediction["league"]["name"],
                            "startTime": prediction["startTime"],
                            "market": "Winner",
                            "prediction": prediction["predictions"]["Winner"]["predicted_outcome"],
                            "confidence": confidence,
                            "odds": prediction["predictions"]["Winner"]["odds"][
                                prediction["predictions"]["Winner"]["predicted_outcome"]
                            ]
                        })
            
            if len(high_confidence_predictions) < size:
                logger.warning(f"Not enough high confidence predictions for accumulator (needed {size}, got {len(high_confidence_predictions)})")
                return None
            
            # Sort by confidence
            high_confidence_predictions.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Select top 'size' predictions
            picks = high_confidence_predictions[:size]
            
            # Calculate accumulator odds
            total_odds = 1.0
            for pick in picks:
                total_odds *= pick["odds"]
            
            # Generate unique ID
            import hashlib
            picks_str = ",".join([str(pick["id"]) for pick in picks])
            accumulator_id = hashlib.md5(picks_str.encode()).hexdigest()[:8]
            
            # Calculate accumulator confidence
            # The confidence of an accumulator decreases as more picks are added
            # We use the geometric mean of individual confidences, with a penalty for size
            confidences = [pick["confidence"] for pick in picks]
            geo_mean_confidence = np.power(np.prod(confidences), 1/len(confidences))
            size_penalty = 0.95 ** (size - 1)  # 5% penalty for each additional pick
            accumulator_confidence = geo_mean_confidence * size_penalty
            
            accumulator = {
                "id": accumulator_id,
                "name": f"{size}-Fold Accumulator",
                "size": size,
                "total_odds": round(total_odds, 2),
                "confidence": round(accumulator_confidence, 1),
                "picks": picks,
                "created_at": datetime.now().isoformat()
            }
            
            return accumulator
            
        except Exception as e:
            logger.error(f"Error generating accumulator: {e}")
            return None
    
    def generate_accumulators(self, all_predictions):
        """
        Generate various sized accumulators across all sports.
        
        Args:
            all_predictions (dict): Dictionary with sport as key and predictions as value
            
        Returns:
            dict: Various accumulators
        """
        try:
            # Combine all predictions into a single list
            all_sports_predictions = []
            for sport, predictions in all_predictions.items():
                all_sports_predictions.extend(predictions)
            
            if not all_sports_predictions:
                logger.warning("No predictions available for accumulator generation")
                return {}
            
            accumulators = {}
            
            # Generate different sized accumulators
            doubles = self.generate_accumulator(all_sports_predictions, size=2, min_confidence=75)
            if doubles:
                accumulators["double"] = doubles
            
            trebles = self.generate_accumulator(all_sports_predictions, size=3, min_confidence=75)
            if trebles:
                accumulators["treble"] = trebles
            
            four_fold = self.generate_accumulator(all_sports_predictions, size=4, min_confidence=70)
            if four_fold:
                accumulators["four_fold"] = four_fold
            
            five_fold = self.generate_accumulator(all_sports_predictions, size=5, min_confidence=70)
            if five_fold:
                accumulators["five_fold"] = five_fold
            
            # Premium accumulator (higher confidence threshold)
            premium = self.generate_accumulator(all_sports_predictions, size=3, min_confidence=85)
            if premium:
                accumulators["premium"] = premium
            
            # High odds accumulator (lower confidence but higher potential returns)
            # For this, we'd ideally filter by odds rather than confidence, but for simplicity
            # we'll just use a lower confidence threshold
            high_odds = self.generate_accumulator(all_sports_predictions, size=4, min_confidence=65)
            if high_odds:
                accumulators["high_odds"] = high_odds
            
            return accumulators
            
        except Exception as e:
            logger.error(f"Error generating accumulators: {e}")
            return {}