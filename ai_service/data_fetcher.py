"""
Data fetching module for the AI Sports Prediction service.
Fetches upcoming matches from different sports APIs.
"""
import requests
import logging
import json
import os
from datetime import datetime, timedelta
from config import FOOTBALL_API_KEY, BASKETBALL_API_KEY, SUPPORTED_SPORTS

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('data_fetcher')

class DataFetcher:
    """Class to fetch sports data from various APIs."""
    
    def __init__(self):
        """Initialize the DataFetcher with API keys."""
        self.football_api_key = FOOTBALL_API_KEY
        self.basketball_api_key = BASKETBALL_API_KEY
        
        # Check if API keys are available
        if not self.football_api_key:
            logger.warning("Football API key not found. Using demo data for football.")
        
        if not self.basketball_api_key:
            logger.warning("Basketball API key not found. Using demo data for basketball.")
    
    def fetch_football_matches(self, days_ahead=3):
        """
        Fetch upcoming football matches using API-Football.
        
        Args:
            days_ahead (int): Number of days ahead to fetch matches for
            
        Returns:
            list: List of upcoming matches
        """
        if not self.football_api_key:
            # Return example data for demo purposes
            return self._get_example_football_matches(days_ahead)
        
        try:
            # Calculate date range
            today = datetime.now().strftime('%Y-%m-%d')
            end_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
            
            # API-Football endpoint for fixtures
            url = "https://api-football-v1.p.rapidapi.com/v3/fixtures"
            
            # Filter by date range and premier league
            # In a real implementation, you would fetch multiple leagues
            headers = {
                "X-RapidAPI-Key": self.football_api_key,
                "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
            }
            
            # Get matches for Premier League
            querystring = {
                "league": "39",  # Premier League ID in the API
                "from": today,
                "to": end_date
            }
            
            response = requests.get(url, headers=headers, params=querystring)
            
            if response.status_code == 200:
                data = response.json()
                
                if data["results"] > 0:
                    matches = self._process_football_data(data["response"])
                    logger.info(f"Successfully fetched {len(matches)} football matches")
                    return matches
                else:
                    logger.warning("No football matches found in the given date range")
                    return []
            else:
                logger.error(f"Failed to fetch football matches: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching football matches: {e}")
            # Fallback to example data in case of error
            return self._get_example_football_matches(days_ahead)
    
    def _process_football_data(self, matches_data):
        """Process raw football API data into structured format."""
        processed_matches = []
        
        for match in matches_data:
            # Extract team info
            home_team = match["teams"]["home"]["name"]
            away_team = match["teams"]["away"]["name"]
            
            # Extract match time
            match_timestamp = match["fixture"]["timestamp"]
            match_time = datetime.fromtimestamp(match_timestamp)
            
            # Extract league info
            league_id = match["league"]["id"]
            league_name = match["league"]["name"]
            country = match["league"]["country"]
            
            # Extract odds if available (would be from a different API endpoint in reality)
            # Here we're setting example odds 
            home_odds = 2.5
            draw_odds = 3.2
            away_odds = 2.8
            
            # Create structured match data
            processed_match = {
                "id": match["fixture"]["id"],
                "sport": "football",
                "league": {
                    "id": league_id,
                    "name": league_name,
                    "country": country
                },
                "homeTeam": {
                    "id": match["teams"]["home"]["id"],
                    "name": home_team,
                    "ranking": None,  # Would need another API call
                    "form": None  # Would need another API call
                },
                "awayTeam": {
                    "id": match["teams"]["away"]["id"],
                    "name": away_team,
                    "ranking": None,  # Would need another API call
                    "form": None  # Would need another API call
                },
                "startTime": match_time,
                "odds": {
                    "home": home_odds,
                    "draw": draw_odds,
                    "away": away_odds
                }
            }
            
            processed_matches.append(processed_match)
        
        return processed_matches
    
    def _get_example_football_matches(self, days_ahead=3):
        """Generate example football matches for demo purposes."""
        matches = []
        leagues = [
            {"id": 1, "name": "Premier League", "country": "England"},
            {"id": 2, "name": "La Liga", "country": "Spain"},
            {"id": 3, "name": "Serie A", "country": "Italy"},
            {"id": 4, "name": "Bundesliga", "country": "Germany"},
            {"id": 5, "name": "Ligue 1", "country": "France"},
            {"id": 6, "name": "Nigerian Professional League", "country": "Nigeria"}
        ]
        
        teams = {
            1: ["Manchester City", "Liverpool", "Chelsea", "Arsenal", "Tottenham", 
                "Manchester United", "West Ham", "Leicester City"],
            2: ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", 
                "Villarreal", "Real Sociedad", "Real Betis", "Athletic Bilbao"],
            3: ["Inter Milan", "AC Milan", "Napoli", "Juventus", 
                "AS Roma", "Lazio", "Atalanta", "Fiorentina"],
            4: ["Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", 
                "Wolfsburg", "Borussia Monchengladbach", "Eintracht Frankfurt", "Stuttgart"],
            5: ["PSG", "Marseille", "Lyon", "Lille", 
                "Monaco", "Rennes", "Nice", "Strasbourg"],
            6: ["Rivers United", "Enyimba", "Plateau United", "Remo Stars", 
                "Kwara United", "Shooting Stars", "Kano Pillars", "Enugu Rangers"]
        }
        
        # Generate matches for each league
        match_id = 1000
        for day in range(days_ahead):
            match_date = datetime.now() + timedelta(days=day+1)
            
            for league_id, league_teams in teams.items():
                league = next((l for l in leagues if l["id"] == league_id), None)
                
                # Create 2 matches per day per league
                for i in range(0, len(league_teams), 2):
                    if i + 1 < len(league_teams):
                        home_team = league_teams[i]
                        away_team = league_teams[i+1]
                        
                        # Generate random but reasonable odds
                        import random
                        home_odds = round(random.uniform(1.5, 4.0), 2)
                        draw_odds = round(random.uniform(2.5, 4.5), 2)
                        away_odds = round(random.uniform(1.5, 4.0), 2)
                        
                        # Create match hours between 12:00 and 20:00
                        match_hour = random.randint(12, 20)
                        match_time = match_date.replace(hour=match_hour, minute=0, second=0)
                        
                        match = {
                            "id": match_id,
                            "sport": "football",
                            "league": {
                                "id": league["id"],
                                "name": league["name"],
                                "country": league["country"]
                            },
                            "homeTeam": {
                                "id": 1000 + league_teams.index(home_team),
                                "name": home_team,
                                "ranking": random.randint(1, 10),
                                "form": "".join(random.choices(["W", "D", "L"], k=5))
                            },
                            "awayTeam": {
                                "id": 1000 + league_teams.index(away_team),
                                "name": away_team,
                                "ranking": random.randint(1, 10),
                                "form": "".join(random.choices(["W", "D", "L"], k=5))
                            },
                            "startTime": match_time,
                            "odds": {
                                "home": home_odds,
                                "draw": draw_odds,
                                "away": away_odds
                            }
                        }
                        
                        matches.append(match)
                        match_id += 1
        
        logger.info(f"Generated {len(matches)} example football matches")
        return matches
    
    def fetch_basketball_matches(self, days_ahead=3):
        """
        Fetch upcoming basketball matches using SportRadar.
        
        Args:
            days_ahead (int): Number of days ahead to fetch matches for
            
        Returns:
            list: List of upcoming matches
        """
        # In a real implementation, this would call the SportRadar API
        # For simplicity, we'll return example data
        return self._get_example_basketball_matches(days_ahead)
    
    def _get_example_basketball_matches(self, days_ahead=3):
        """Generate example basketball matches for demo purposes."""
        matches = []
        leagues = [
            {"id": 1, "name": "NBA", "country": "USA"},
            {"id": 2, "name": "EuroLeague", "country": "Europe"}
        ]
        
        teams = {
            1: ["Los Angeles Lakers", "Boston Celtics", "Golden State Warriors", "Chicago Bulls", 
                "Miami Heat", "Brooklyn Nets", "Milwaukee Bucks", "Phoenix Suns"],
            2: ["Real Madrid", "CSKA Moscow", "FC Barcelona", "Anadolu Efes", 
                "Fenerbahce", "Olympiacos", "Bayern Munich", "Maccabi Tel Aviv"]
        }
        
        # Generate matches for each league
        match_id = 2000
        for day in range(days_ahead):
            match_date = datetime.now() + timedelta(days=day+1)
            
            for league_id, league_teams in teams.items():
                league = next((l for l in leagues if l["id"] == league_id), None)
                
                # Create 2 matches per day per league
                for i in range(0, len(league_teams), 2):
                    if i + 1 < len(league_teams):
                        home_team = league_teams[i]
                        away_team = league_teams[i+1]
                        
                        # Generate random but reasonable odds
                        import random
                        home_odds = round(random.uniform(1.3, 3.0), 2)
                        away_odds = round(random.uniform(1.3, 3.0), 2)
                        
                        # Create match hours between 18:00 and 22:00
                        match_hour = random.randint(18, 22)
                        match_time = match_date.replace(hour=match_hour, minute=0, second=0)
                        
                        match = {
                            "id": match_id,
                            "sport": "basketball",
                            "league": {
                                "id": league["id"],
                                "name": league["name"],
                                "country": league["country"]
                            },
                            "homeTeam": {
                                "id": 2000 + league_teams.index(home_team),
                                "name": home_team,
                                "ranking": random.randint(1, 10),
                                "form": "".join(random.choices(["W", "L"], k=5))
                            },
                            "awayTeam": {
                                "id": 2000 + league_teams.index(away_team),
                                "name": away_team,
                                "ranking": random.randint(1, 10),
                                "form": "".join(random.choices(["W", "L"], k=5))
                            },
                            "startTime": match_time,
                            "odds": {
                                "home": home_odds,
                                "away": away_odds
                            }
                        }
                        
                        matches.append(match)
                        match_id += 1
        
        logger.info(f"Generated {len(matches)} example basketball matches")
        return matches
    
    def fetch_matches_by_sport(self, sport, days_ahead=3):
        """
        Fetch matches for a specific sport.
        
        Args:
            sport (str): Sport name (football, basketball, etc.)
            days_ahead (int): Number of days to fetch ahead
            
        Returns:
            list: List of upcoming matches
        """
        if sport not in SUPPORTED_SPORTS:
            logger.error(f"Unsupported sport: {sport}")
            return []
        
        if not SUPPORTED_SPORTS[sport]["enabled"]:
            logger.warning(f"Sport {sport} is disabled in the configuration")
            return []
        
        if sport == "football":
            return self.fetch_football_matches(days_ahead)
        elif sport == "basketball":
            return self.fetch_basketball_matches(days_ahead)
        else:
            logger.warning(f"Fetching not implemented for sport: {sport}")
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
                logger.info(f"Fetching matches for {sport}")
                all_matches[sport] = self.fetch_matches_by_sport(sport, days_ahead)
        
        return all_matches