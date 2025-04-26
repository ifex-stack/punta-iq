"""
Generate synthetic training data for the AI Sports Prediction models.
This is a utility script to create example training data for demonstration.
In a real implementation, this would use historical match data from APIs.
"""
import os
import pandas as pd
import numpy as np
import random
import logging
from datetime import datetime, timedelta
from predictor import Predictor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('generate_training_data')

def generate_football_training_data(n_samples=1000):
    """
    Generate synthetic training data for football prediction models.
    
    Args:
        n_samples (int): Number of samples to generate
        
    Returns:
        pd.DataFrame: Dataframe with training data
    """
    # Generate features
    np.random.seed(42)
    
    # Team rankings (1-20, where 1 is the best)
    home_rank = np.random.randint(1, 21, n_samples)
    away_rank = np.random.randint(1, 21, n_samples)
    
    # Team form (0-15, where 15 is the best - sum of 5 matches with W=3, D=1, L=0)
    home_form = np.random.randint(0, 16, n_samples)
    away_form = np.random.randint(0, 16, n_samples)
    
    # Goals for and against (recent historical average)
    home_goals_for = np.random.normal(1.6, 0.5, n_samples)
    home_goals_against = np.random.normal(1.2, 0.4, n_samples)
    away_goals_for = np.random.normal(1.2, 0.4, n_samples)
    away_goals_against = np.random.normal(1.6, 0.5, n_samples)
    
    # Make better ranked teams have better stats
    for i in range(n_samples):
        # Adjust goals based on rank (better teams score more, concede less)
        rank_effect = (21 - home_rank[i]) / 10
        home_goals_for[i] += rank_effect
        home_goals_against[i] -= rank_effect * 0.5
        
        rank_effect = (21 - away_rank[i]) / 10
        away_goals_for[i] += rank_effect * 0.8  # Away teams score less
        away_goals_against[i] -= rank_effect * 0.4
        
        # Make sure all values are positive
        home_goals_for[i] = max(0.5, home_goals_for[i])
        home_goals_against[i] = max(0.3, home_goals_against[i])
        away_goals_for[i] = max(0.3, away_goals_for[i])
        away_goals_against[i] = max(0.5, away_goals_against[i])
    
    # Create DataFrame
    df = pd.DataFrame({
        'home_rank': home_rank,
        'away_rank': away_rank,
        'home_form': home_form,
        'away_form': away_form,
        'home_goals_for': home_goals_for,
        'home_goals_against': home_goals_against,
        'away_goals_for': away_goals_for,
        'away_goals_against': away_goals_against
    })
    
    # Generate match outcomes based on features
    results = []
    btts = []
    over_2_5 = []
    
    for _, row in df.iterrows():
        # Calculate team strengths
        home_strength = ((21 - row['home_rank']) * 1.5 + row['home_form'] / 2 +
                         row['home_goals_for'] - row['home_goals_against'])
        
        away_strength = ((21 - row['away_rank']) + row['away_form'] / 2 +
                          row['away_goals_for'] - row['away_goals_against'])
        
        # Add home advantage
        home_strength *= 1.3
        
        # Calculate result probabilities
        total_strength = home_strength + away_strength
        home_prob = home_strength / total_strength
        away_prob = away_strength / total_strength
        draw_prob = 1 - home_prob - away_prob
        
        # Adjust draw probability (draws are more common in football than simple model predicts)
        if draw_prob < 0.2:
            adjustment = 0.2 - draw_prob
            home_prob -= adjustment * (home_prob / (home_prob + away_prob))
            away_prob -= adjustment * (away_prob / (home_prob + away_prob))
            draw_prob = 0.2
        
        # Generate random result based on probabilities
        result_probs = [home_prob, draw_prob, away_prob]
        result = np.random.choice(['H', 'D', 'A'], p=result_probs)
        results.append(result)
        
        # Generate expected goals
        home_xg = max(0, np.random.normal(row['home_goals_for'] - row['away_goals_against'] / 2, 0.5))
        away_xg = max(0, np.random.normal(row['away_goals_for'] - row['home_goals_against'] / 2, 0.5))
        
        # Generate actual goals based on expected goals and result
        if result == 'H':
            home_goals = max(1, np.random.poisson(home_xg))
            away_goals = np.random.poisson(away_xg * 0.8)  # Losing team scores less than expected
        elif result == 'A':
            home_goals = np.random.poisson(home_xg * 0.8)  # Losing team scores less than expected
            away_goals = max(1, np.random.poisson(away_xg))
        else:  # Draw
            # For a draw, goals need to be equal
            mean_xg = (home_xg + away_xg) / 2
            goals = np.random.poisson(mean_xg)
            home_goals = away_goals = goals
        
        # BTTS (Both Teams To Score)
        btts.append(1 if home_goals > 0 and away_goals > 0 else 0)
        
        # Over/Under 2.5 goals
        over_2_5.append(1 if home_goals + away_goals > 2.5 else 0)
    
    # Add results to DataFrame
    df['result'] = results
    df['btts'] = btts
    df['over_2_5'] = over_2_5
    
    return df

def generate_basketball_training_data(n_samples=1000):
    """
    Generate synthetic training data for basketball prediction models.
    
    Args:
        n_samples (int): Number of samples to generate
        
    Returns:
        pd.DataFrame: Dataframe with training data
    """
    # Generate features
    np.random.seed(43)
    
    # Team rankings (1-15, where 1 is the best)
    home_rank = np.random.randint(1, 16, n_samples)
    away_rank = np.random.randint(1, 16, n_samples)
    
    # Team form (0-10, where 10 is the best - sum of 10 matches with W=1, L=0)
    home_form = np.random.randint(0, 11, n_samples)
    away_form = np.random.randint(0, 11, n_samples)
    
    # Offensive and defensive ratings
    home_offense = np.random.normal(110, 5, n_samples)
    home_defense = np.random.normal(105, 5, n_samples)
    away_offense = np.random.normal(108, 5, n_samples)
    away_defense = np.random.normal(107, 5, n_samples)
    
    # Make better ranked teams have better stats
    for i in range(n_samples):
        # Adjust ratings based on rank (better teams have higher offensive and lower defensive ratings)
        rank_effect = (16 - home_rank[i]) * 2
        home_offense[i] += rank_effect
        home_defense[i] -= rank_effect / 2
        
        rank_effect = (16 - away_rank[i]) * 2
        away_offense[i] += rank_effect * 0.8  # Away teams perform a bit worse
        away_defense[i] -= rank_effect / 2
    
    # Create DataFrame
    df = pd.DataFrame({
        'home_rank': home_rank,
        'away_rank': away_rank,
        'home_form': home_form,
        'away_form': away_form,
        'home_offense': home_offense,
        'home_defense': home_defense,
        'away_offense': away_offense,
        'away_defense': away_defense
    })
    
    # Generate match outcomes based on features
    results = []
    totals = []
    
    for _, row in df.iterrows():
        # Calculate team strengths
        home_strength = ((16 - row['home_rank']) * 2 + row['home_form'] +
                         (row['home_offense'] - row['home_defense']) / 10)
        
        away_strength = ((16 - row['away_rank']) * 2 + row['away_form'] +
                          (row['away_offense'] - row['away_defense']) / 10)
        
        # Add home advantage
        home_strength *= 1.2
        
        # Calculate win probabilities
        total_strength = home_strength + away_strength
        home_prob = home_strength / total_strength
        away_prob = 1 - home_prob
        
        # Generate random result based on probabilities
        result = np.random.choice(['H', 'A'], p=[home_prob, away_prob])
        results.append(result)
        
        # Generate expected points
        home_expected_points = row['home_offense'] - row['away_defense'] + 3  # Home court bonus
        away_expected_points = row['away_offense'] - row['home_defense']
        
        # Generate actual points based on expected points and result
        if result == 'H':
            home_points = max(70, np.random.normal(home_expected_points, 8))
            away_points = max(60, np.random.normal(away_expected_points * 0.95, 8))  # Losing team scores slightly less
        else:  # Away win
            home_points = max(70, np.random.normal(home_expected_points * 0.95, 8))  # Losing team scores slightly less
            away_points = max(70, np.random.normal(away_expected_points, 8))
        
        # Total points
        total_points = home_points + away_points
        totals.append(total_points)
    
    # Add results to DataFrame
    df['result'] = results
    df['total_points'] = totals
    df['over_200'] = [1 if total > 200 else 0 for total in totals]
    
    return df

def train_and_save_models():
    """Train and save models using the generated data."""
    try:
        logger.info("Generating training data...")
        football_data = generate_football_training_data(n_samples=2000)
        basketball_data = generate_basketball_training_data(n_samples=1500)
        
        logger.info("Training models...")
        predictor = Predictor()
        
        # Train football models
        football_success = predictor.train_football_model(football_data, model_type="xgboost")
        
        # Train basketball models (simplified - in real implementation we would have proper models)
        # Note: Basketball model training would be implemented here
        
        logger.info("Models trained and saved successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error training models: {e}")
        return False

def main():
    """Main function to generate training data and save to CSV files."""
    try:
        # Create models directory if it doesn't exist
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
        
        # Generate and save data
        football_data = generate_football_training_data(n_samples=2000)
        basketball_data = generate_basketball_training_data(n_samples=1500)
        
        # Save to CSV files
        football_data.to_csv(os.path.join(models_dir, "football_training_data.csv"), index=False)
        basketball_data.to_csv(os.path.join(models_dir, "basketball_training_data.csv"), index=False)
        
        logger.info("Training data generated and saved successfully")
        
        # Train and save models
        success = train_and_save_models()
        
        if success:
            logger.info("Models trained and saved successfully")
            return 0
        else:
            logger.error("Error training models")
            return 1
        
    except Exception as e:
        logger.error(f"Error in main function: {e}")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())