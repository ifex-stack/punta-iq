"""
Generate synthetic training data for the AI Sports Prediction models.
This is a utility script to create example training data for demonstration.
In a real implementation, this would use historical match data from APIs.
"""
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import pickle

def generate_football_training_data(n_samples=1000):
    """
    Generate synthetic training data for football prediction models.
    
    Args:
        n_samples (int): Number of samples to generate
        
    Returns:
        pd.DataFrame: Dataframe with training data
    """
    np.random.seed(42)  # For reproducibility
    
    # Generate features
    home_team_rank = np.random.randint(1, 21, n_samples)  # 1-20 for league positions
    away_team_rank = np.random.randint(1, 21, n_samples)
    
    home_form = np.random.randint(0, 101, n_samples)  # 0-100 form rating
    away_form = np.random.randint(0, 101, n_samples)
    
    home_goals_scored_avg = np.random.uniform(0.5, 3.0, n_samples)
    away_goals_scored_avg = np.random.uniform(0.5, 2.5, n_samples)
    
    home_goals_conceded_avg = np.random.uniform(0.5, 2.5, n_samples)
    away_goals_conceded_avg = np.random.uniform(0.5, 3.0, n_samples)
    
    # Generate target with bias based on features
    result = []
    for i in range(n_samples):
        # Home advantage factor
        home_advantage = 0.1
        
        # Team strength difference based on rank (higher rank is better)
        rank_diff = (21 - home_team_rank[i]) - (21 - away_team_rank[i])
        rank_factor = rank_diff * 0.02  # Scale factor
        
        # Form difference
        form_diff = (home_form[i] - away_form[i]) * 0.001
        
        # Goal scoring ability
        goal_diff = (home_goals_scored_avg[i] - away_goals_conceded_avg[i]) - (away_goals_scored_avg[i] - home_goals_conceded_avg[i])
        goal_factor = goal_diff * 0.05
        
        # Combine factors
        home_win_prob = 0.45 + home_advantage + rank_factor + form_diff + goal_factor
        away_win_prob = 0.3 - home_advantage - rank_factor - form_diff - goal_factor
        draw_prob = 1.0 - home_win_prob - away_win_prob
        
        # Ensure probabilities are valid
        if home_win_prob < 0: home_win_prob = 0.05
        if away_win_prob < 0: away_win_prob = 0.05
        if draw_prob < 0: draw_prob = 0.05
        
        # Normalize probabilities
        total = home_win_prob + away_win_prob + draw_prob
        home_win_prob /= total
        away_win_prob /= total
        draw_prob /= total
        
        # Choose outcome based on probabilities
        probs = [home_win_prob, draw_prob, away_win_prob]
        outcome = np.random.choice(['home_win', 'draw', 'away_win'], p=probs)
        result.append(outcome)
    
    # Create dataframe
    data = pd.DataFrame({
        'home_team_rank': home_team_rank,
        'away_team_rank': away_team_rank,
        'home_form': home_form,
        'away_form': away_form,
        'home_goals_scored_avg': home_goals_scored_avg,
        'away_goals_scored_avg': away_goals_scored_avg,
        'home_goals_conceded_avg': home_goals_conceded_avg,
        'away_goals_conceded_avg': away_goals_conceded_avg,
        'result': result
    })
    
    return data

def generate_basketball_training_data(n_samples=1000):
    """
    Generate synthetic training data for basketball prediction models.
    
    Args:
        n_samples (int): Number of samples to generate
        
    Returns:
        pd.DataFrame: Dataframe with training data
    """
    np.random.seed(43)  # Different seed than football
    
    # Generate features
    home_team_rank = np.random.randint(1, 31, n_samples)  # 1-30 for NBA teams
    away_team_rank = np.random.randint(1, 31, n_samples)
    
    home_form = np.random.randint(0, 101, n_samples)
    away_form = np.random.randint(0, 101, n_samples)
    
    home_points_avg = np.random.uniform(90, 120, n_samples)
    away_points_avg = np.random.uniform(90, 120, n_samples)
    
    home_defense_rating = np.random.uniform(95, 115, n_samples)
    away_defense_rating = np.random.uniform(95, 115, n_samples)
    
    # Generate target with bias based on features
    result = []
    for i in range(n_samples):
        # Home advantage factor
        home_advantage = 0.15
        
        # Team strength difference based on rank (higher rank is better)
        rank_diff = (31 - home_team_rank[i]) - (31 - away_team_rank[i])
        rank_factor = rank_diff * 0.01
        
        # Form difference
        form_diff = (home_form[i] - away_form[i]) * 0.001
        
        # Scoring and defense
        rating_diff = (home_points_avg[i] - away_defense_rating[i]) - (away_points_avg[i] - home_defense_rating[i])
        rating_factor = rating_diff * 0.005
        
        # Combine factors
        home_win_prob = 0.5 + home_advantage + rank_factor + form_diff + rating_factor
        away_win_prob = 1.0 - home_win_prob
        
        # Ensure probabilities are valid
        if home_win_prob < 0.05: home_win_prob = 0.05
        if home_win_prob > 0.95: home_win_prob = 0.95
        away_win_prob = 1.0 - home_win_prob
        
        # Choose outcome based on probabilities
        outcome = np.random.choice(['home_win', 'away_win'], p=[home_win_prob, away_win_prob])
        result.append(outcome)
    
    # Create dataframe
    data = pd.DataFrame({
        'home_team_rank': home_team_rank,
        'away_team_rank': away_team_rank,
        'home_form': home_form,
        'away_form': away_form,
        'home_points_avg': home_points_avg,
        'away_points_avg': away_points_avg,
        'home_defense_rating': home_defense_rating,
        'away_defense_rating': away_defense_rating,
        'result': result
    })
    
    return data

def train_and_save_models():
    """Train and save models using the generated data."""
    from predictor import Predictor
    
    print("Generating training data...")
    football_data = generate_football_training_data(n_samples=2000)
    # basketball_data = generate_basketball_training_data(n_samples=2000)
    
    print("Training models...")
    predictor = Predictor()
    
    # Train football model
    success = predictor.train_football_model(football_data, model_type="xgboost")
    print(f"Football model training: {'Success' if success else 'Failed'}")
    
    # Train basketball model (would be implemented in the Predictor class)
    # success = predictor.train_basketball_model(basketball_data)
    # print(f"Basketball model training: {'Success' if success else 'Failed'}")
    
    print("Model training completed")

def main():
    """Main function to generate training data and save to CSV files."""
    os.makedirs('data', exist_ok=True)
    
    print("Generating football training data...")
    football_data = generate_football_training_data(n_samples=2000)
    football_data.to_csv('data/football_training_data.csv', index=False)
    print(f"Saved football training data with {len(football_data)} samples")
    
    print("Generating basketball training data...")
    basketball_data = generate_basketball_training_data(n_samples=2000)
    basketball_data.to_csv('data/basketball_training_data.csv', index=False)
    print(f"Saved basketball training data with {len(basketball_data)} samples")
    
    # Uncomment to train and save models
    # train_and_save_models()
    
    print("Done!")

if __name__ == "__main__":
    main()