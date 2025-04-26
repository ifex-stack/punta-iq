"""
Data fetching module for the AI Sports Prediction service.
Fetches upcoming matches from different sports APIs.
"""
import requests
import json
import pandas as pd
from datetime import datetime, timedelta
from config import API_FOOTBALL_KEY, SPORTRADAR_KEY, SUPPORTED_SPORTS

class DataFetcher:
    """Class to fetch sports data from various APIs."""
    
    def __init__(self):
        """Initialize the DataFetcher with API keys."""
        self.api_football_key = API_FOOTBALL_KEY
        self.sportradar_key = SPORTRADAR_KEY
        
    def fetch_football_matches(self, days_ahead=3):
        """
        Fetch upcoming football matches using API-Football.
        
        Args:
            days_ahead (int): Number of days ahead to fetch matches for
            
        Returns:
            list: List of upcoming matches
        """
        if not self.api_football_key:
            print("API-Football key not found. Please set API_FOOTBALL_KEY environment variable.")
            return []
        
        # Calculate date range
        today = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        
        url = "https://api-football-v1.p.rapidapi.com/v3/fixtures"
        headers = {
            "X-RapidAPI-Key": self.api_football_key,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
        }
        params = {
            "from": today,
            "to": end_date,
            "league": "39,140,135,78,61", # Premier League, La Liga, Serie A, Bundesliga, Ligue 1
            "timezone": "UTC"
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get("response"):
                    return self._process_football_data(data["response"])
                else:
                    print("No football matches found in the API response")
            else:
                print(f"Failed to fetch football data: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"Error fetching football data: {e}")
            
        return []
    
    def _process_football_data(self, matches_data):
        """Process raw football API data into structured format."""
        processed_matches = []
        
        for match in matches_data:
            try:
                fixture = match.get("fixture", {})
                teams = match.get("teams", {})
                league = match.get("league", {})
                odds = match.get("odds", [])
                
                processed_match = {
                    "match_id": fixture.get("id"),
                    "sport": "football",
                    "league_id": league.get("id"),
                    "league_name": league.get("name"),
                    "country": league.get("country"),
                    "home_team": teams.get("home", {}).get("name"),
                    "away_team": teams.get("away", {}).get("name"),
                    "start_time": fixture.get("date"),
                    "status": fixture.get("status", {}).get("long"),
                    "venue": fixture.get("venue", {}).get("name"),
                    "home_team_rank": teams.get("home", {}).get("position"),
                    "away_team_rank": teams.get("away", {}).get("position"),
                    "bookmaker_odds": odds
                }
                processed_matches.append(processed_match)
            except Exception as e:
                print(f"Error processing match data: {e}")
        
        return processed_matches
    
    def fetch_basketball_matches(self, days_ahead=3):
        """
        Fetch upcoming basketball matches using SportRadar.
        
        Args:
            days_ahead (int): Number of days ahead to fetch matches for
            
        Returns:
            list: List of upcoming matches
        """
        if not self.sportradar_key:
            print("SportRadar key not found. Please set SPORTRADAR_KEY environment variable.")
            return []
        
        # This would use the actual SportRadar API
        # For this example, we're returning a placeholder
        # In a real implementation, you would make the API call to SportRadar
        print("Basketball data fetching would use SportRadar API")
        return []
    
    def fetch_matches_by_sport(self, sport, days_ahead=3):
        """
        Fetch matches for a specific sport.
        
        Args:
            sport (str): Sport name (football, basketball, etc.)
            days_ahead (int): Number of days to fetch ahead
            
        Returns:
            list: List of upcoming matches
        """
        if sport not in SUPPORTED_SPORTS or not SUPPORTED_SPORTS[sport]["enabled"]:
            print(f"Sport {sport} is not supported or not enabled")
            return []
        
        if sport == "football":
            return self.fetch_football_matches(days_ahead)
        elif sport == "basketball":
            return self.fetch_basketball_matches(days_ahead)
        # Add more sports as needed
        else:
            print(f"Fetching for {sport} not implemented yet")
            return []
    
    def fetch_all_matches(self, days_ahead=3):
        """
        Fetch matches for all enabled sports.
        
        Args:
            days_ahead (int): Number of days to fetch ahead
            
        Returns:
            dict: Dictionary with sport as key and matches as value
        """
        all_matches = {}
        
        for sport, config in SUPPORTED_SPORTS.items():
            if config["enabled"]:
                print(f"Fetching {sport} matches...")
                matches = self.fetch_matches_by_sport(sport, days_ahead)
                all_matches[sport] = matches
                print(f"Found {len(matches)} {sport} matches")
        
        return all_matches


# Example usage
if __name__ == "__main__":
    fetcher = DataFetcher()
    matches = fetcher.fetch_all_matches(days_ahead=3)
    print(json.dumps(matches, indent=2))