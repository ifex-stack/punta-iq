"""
Test script for the AI Sports Prediction service.
This script runs a simplified version of the prediction pipeline without
external API calls or Firebase storage to verify the core logic.
"""
import os
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from data_fetcher import DataFetcher
from predictor import Predictor

def generate_test_matches(n_matches=10):
    """
    Generate test match data for prediction testing.
    
    Args:
        n_matches (int): Number of matches to generate
        
    Returns:
        list: List of generated match data
    """
    np.random.seed(42)
    
    matches = []
    teams = [
        "Manchester United", "Liverpool", "Chelsea", "Arsenal", 
        "Manchester City", "Tottenham", "Leicester", "West Ham",
        "Everton", "Leeds", "Aston Villa", "Newcastle", "Wolves",
        "Crystal Palace", "Southampton", "Brighton", "Burnley",
        "Watford", "Norwich", "Brentford"
    ]
    
    leagues = [
        {"id": 1, "name": "Premier League", "country": "England"},
        {"id": 2, "name": "La Liga", "country": "Spain"},
        {"id": 3, "name": "Serie A", "country": "Italy"},
        {"id": 4, "name": "Bundesliga", "country": "Germany"}
    ]
    
    today = datetime.now()
    
    for i in range(n_matches):
        # Select random teams ensuring they're different
        team_indices = np.random.choice(len(teams), 2, replace=False)
        home_team = teams[team_indices[0]]
        away_team = teams[team_indices[1]]
        
        # Select random league
        league = leagues[np.random.randint(0, len(leagues))]
        
        # Generate random stats
        home_team_rank = np.random.randint(1, 21)
        away_team_rank = np.random.randint(1, 21)
        home_form = np.random.randint(30, 101)
        away_form = np.random.randint(30, 101)
        home_goals_scored_avg = np.random.uniform(1.0, 2.5)
        away_goals_scored_avg = np.random.uniform(0.8, 2.0)
        home_goals_conceded_avg = np.random.uniform(0.8, 2.0)
        away_goals_conceded_avg = np.random.uniform(1.0, 2.5)
        
        # Generate random odds
        home_odds = np.random.uniform(1.5, 3.5)
        draw_odds = np.random.uniform(3.0, 4.5)
        away_odds = np.random.uniform(1.8, 5.0)
        
        # Generate random future date
        days_ahead = np.random.randint(1, 5)
        match_date = (today + timedelta(days=days_ahead)).isoformat()
        
        # Create match data
        match = {
            "match_id": i + 1,
            "sport": "football",
            "league_id": league["id"],
            "league_name": league["name"],
            "country": league["country"],
            "home_team": home_team,
            "away_team": away_team,
            "start_time": match_date,
            "status": "Not Started",
            "venue": f"{home_team} Stadium",
            "home_team_rank": home_team_rank,
            "away_team_rank": away_team_rank,
            "home_form": home_form,
            "away_form": away_form,
            "home_goals_scored_avg": home_goals_scored_avg,
            "away_goals_scored_avg": away_goals_scored_avg,
            "home_goals_conceded_avg": home_goals_conceded_avg,
            "away_goals_conceded_avg": away_goals_conceded_avg,
            "bookmaker_odds": [
                {"name": "1X2", "odds": [
                    {"value": "home", "odd": home_odds},
                    {"value": "draw", "odd": draw_odds},
                    {"value": "away", "odd": away_odds}
                ]}
            ]
        }
        
        matches.append(match)
    
    return matches

def test_prediction_pipeline():
    """Run a test of the prediction pipeline with generated data."""
    print("Testing prediction pipeline...")
    
    # Generate test match data
    test_matches = generate_test_matches(n_matches=20)
    print(f"Generated {len(test_matches)} test matches")
    
    # Initialize predictor
    predictor = Predictor()
    
    # Generate predictions
    predictions = predictor.predict_matches(test_matches, "football")
    print(f"Generated {len(predictions)} predictions")
    
    # Generate accumulators
    accumulators = predictor.generate_accumulators({"football": predictions})
    print(f"Generated {len(accumulators)} accumulator types")
    
    # Print sample predictions
    print("\nSample prediction:")
    sample = predictions[0]
    print(f"Match: {sample['home_team']} vs {sample['away_team']}")
    
    for market, prediction in sample['predictions'].items():
        print(f"  {market}: {prediction['predicted_outcome']} (confidence: {prediction['confidence']}%)")
    
    # Print sample accumulator
    print("\nSample double accumulator:")
    double = accumulators['double']
    print(f"Confidence: {double['confidence']}%")
    print(f"Number of picks: {double['size']}")
    
    for i, pick in enumerate(double['picks']):
        print(f"  {i+1}. {pick['home_team']} vs {pick['away_team']} - {pick['prediction']} (confidence: {pick['confidence']}%)")
    
    print("\nTest completed successfully")

if __name__ == "__main__":
    test_prediction_pipeline()