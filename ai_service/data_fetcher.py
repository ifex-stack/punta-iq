"""
Data fetching module for the AI Sports Prediction service.
Fetches upcoming matches from different sports APIs.
"""
import os
import json
import logging
import random
from datetime import datetime, timedelta
import requests
from config import FOOTBALL_API_KEY, BASKETBALL_API_KEY

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
        
        # Log API key status
        if not self.football_api_key:
            logger.warning("Football API key not found. Using example data.")
        
        if not self.basketball_api_key:
            logger.warning("Basketball API key not found. Using example data.")
    
    def fetch_football_matches(self, days_ahead=3):
        """
        Fetch upcoming football matches using API-Football.
        
        Args:
            days_ahead (int): Number of days ahead to fetch matches for
            
        Returns:
            list: List of upcoming matches
        """
        if not self.football_api_key:
            logger.info("No football API key. Using example data.")
            return self._get_example_football_matches(days_ahead)
        
        try:
            # Calculate date range
            start_date = datetime.now().strftime("%Y-%m-%d")
            end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
            # API Football endpoint (using v3)
            base_url = "https://api-football-v1.p.rapidapi.com/v3"
            endpoint = "/fixtures"
            
            # Request headers
            headers = {
                "X-RapidAPI-Key": self.football_api_key,
                "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
            }
            
            # Request parameters
            params = {
                "from": start_date,
                "to": end_date,
                "league": "39,140,135,78,61,291",  # Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Nigerian League
                "timezone": "UTC"
            }
            
            # Make API request
            response = requests.get(f"{base_url}{endpoint}", headers=headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"Football API error: {response.status_code} - {response.text}")
                return self._get_example_football_matches(days_ahead)
            
            # Parse response
            data = response.json()
            
            if data.get("errors"):
                logger.error(f"Football API errors: {data['errors']}")
                return self._get_example_football_matches(days_ahead)
            
            if not data.get("response"):
                logger.warning("No football matches found in API response")
                return self._get_example_football_matches(days_ahead)
            
            # Process the matches data
            matches = self._process_football_data(data["response"])
            
            logger.info(f"Fetched {len(matches)} football matches from API")
            return matches
            
        except Exception as e:
            logger.error(f"Error fetching football matches: {e}")
            return self._get_example_football_matches(days_ahead)
    
    def _process_football_data(self, matches_data):
        """Process raw football API data into structured format."""
        processed_matches = []
        
        for match in matches_data:
            try:
                fixture = match.get("fixture", {})
                league = match.get("league", {})
                teams = match.get("teams", {})
                goals = match.get("goals", {})
                score = match.get("score", {})
                
                # Extract basic match info
                match_id = fixture.get("id")
                start_time = fixture.get("date")
                status = fixture.get("status", {}).get("short")
                
                # Extract team info
                home_team = teams.get("home", {})
                away_team = teams.get("away", {})
                
                # Extract league info
                league_info = {
                    "id": league.get("id"),
                    "name": league.get("name"),
                    "country": league.get("country")
                }
                
                # Check if the match is upcoming
                if status != "NS":  # NS = Not Started
                    continue
                
                # Fetch odds if available
                home_odds = 2.0
                draw_odds = 3.5
                away_odds = 4.0
                
                # In a real implementation, we'd fetch odds from a betting API
                # For now, we'll generate random odds
                home_rank = random.randint(1, 20)
                away_rank = random.randint(1, 20)
                
                home_form = "".join(random.choices("WDL", k=5))
                away_form = "".join(random.choices("WDL", k=5))
                
                # Generate faux odds based on team ranks
                if home_rank < away_rank:
                    home_odds = round(1.5 + (home_rank / 20), 2)
                    away_odds = round(2.0 + (home_rank / 10), 2)
                    draw_odds = round((home_odds + away_odds) / 2, 2)
                else:
                    away_odds = round(1.5 + (away_rank / 20), 2)
                    home_odds = round(2.0 + (away_rank / 10), 2)
                    draw_odds = round((home_odds + away_odds) / 2, 2)
                
                # Create match object
                match_obj = {
                    "id": match_id,
                    "sport": "football",
                    "league": league_info,
                    "startTime": start_time,
                    "homeTeam": {
                        "id": home_team.get("id"),
                        "name": home_team.get("name"),
                        "ranking": home_rank,
                        "form": home_form
                    },
                    "awayTeam": {
                        "id": away_team.get("id"),
                        "name": away_team.get("name"),
                        "ranking": away_rank,
                        "form": away_form
                    },
                    "odds": {
                        "home": home_odds,
                        "draw": draw_odds,
                        "away": away_odds
                    }
                }
                
                processed_matches.append(match_obj)
                
            except Exception as e:
                logger.error(f"Error processing football match: {e}")
        
        return processed_matches
    
    def _get_example_football_matches(self, days_ahead=3):
        """Generate example football matches for demo purposes."""
        leagues = [
            {"id": 1, "name": "Premier League", "country": "England"},
            {"id": 2, "name": "La Liga", "country": "Spain"},
            {"id": 3, "name": "Serie A", "country": "Italy"},
            {"id": 4, "name": "Bundesliga", "country": "Germany"},
            {"id": 5, "name": "Ligue 1", "country": "France"},
            {"id": 6, "name": "Nigerian Professional League", "country": "Nigeria"}
        ]
        
        teams = {
            "Premier League": [
                "Manchester City", "Liverpool", "Chelsea", "Arsenal", "Tottenham", 
                "Manchester United", "West Ham", "Leicester City", "Aston Villa", "Newcastle",
                "Brighton", "Crystal Palace", "Brentford", "Southampton", "Everton",
                "Nottingham Forest", "Wolverhampton", "Leeds United", "Burnley", "Watford"
            ],
            "La Liga": [
                "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Betis",
                "Real Sociedad", "Villarreal", "Athletic Bilbao", "Osasuna", "Valencia",
                "Celta Vigo", "Espanyol", "Getafe", "Mallorca", "Rayo Vallecano",
                "Elche", "Granada", "Cadiz", "Levante", "Alaves"
            ],
            "Serie A": [
                "Inter Milan", "AC Milan", "Napoli", "Juventus", "Atalanta",
                "AS Roma", "Lazio", "Fiorentina", "Verona", "Torino",
                "Sassuolo", "Bologna", "Empoli", "Udinese", "Sampdoria",
                "Spezia", "Cagliari", "Venezia", "Genoa", "Salernitana"
            ],
            "Bundesliga": [
                "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", "Wolfsburg",
                "Eintracht Frankfurt", "Borussia Monchengladbach", "Union Berlin", "Freiburg", "Stuttgart",
                "Mainz", "Hoffenheim", "Augsburg", "Hertha Berlin", "Arminia Bielefeld",
                "Koln", "Werder Bremen", "Schalke", "Bochum", "Greuther Furth"
            ],
            "Ligue 1": [
                "Paris Saint-Germain", "Lille", "Lyon", "Monaco", "Marseille",
                "Rennes", "Nice", "Lens", "Montpellier", "Strasbourg",
                "Angers", "Bordeaux", "Nantes", "Reims", "Saint-Etienne",
                "Brest", "Metz", "Lorient", "Troyes", "Clermont Foot"
            ],
            "Nigerian Professional League": [
                "Enyimba", "Kano Pillars", "Rivers United", "Akwa United", "Plateau United",
                "Enugu Rangers", "Shooting Stars", "Sunshine Stars", "Kwara United", "Heartland",
                "Lobi Stars", "Nasarawa United", "Abia Warriors", "Gombe United", "Wikki Tourists",
                "MFM FC", "Warri Wolves", "Katsina United", "Jigawa Golden Stars", "Ifeanyi Ubah"
            ]
        }
        
        matches = []
        
        # Generate 5-10 matches per league
        for league in leagues:
            league_name = league["name"]
            league_teams = teams.get(league_name, teams["Premier League"])
            
            num_matches = random.randint(5, 10)
            for _ in range(num_matches):
                # Select two random teams
                home_team, away_team = random.sample(league_teams, 2)
                
                # Generate random rankings (1-20, 1 being best)
                home_rank = random.randint(1, 20)
                away_rank = random.randint(1, 20)
                
                # Generate form (W=Win, D=Draw, L=Loss) for last 5 matches
                home_form = "".join(random.choices("WDL", k=5))
                away_form = "".join(random.choices("WDL", k=5))
                
                # Generate odds based on rankings
                if home_rank < away_rank:
                    home_odds = round(1.5 + (home_rank / 20), 2)
                    away_odds = round(2.0 + (home_rank / 10), 2)
                    draw_odds = round((home_odds + away_odds) / 2, 2)
                else:
                    away_odds = round(1.5 + (away_rank / 20), 2)
                    home_odds = round(2.0 + (away_rank / 10), 2)
                    draw_odds = round((home_odds + away_odds) / 2, 2)
                
                # Generate match start time (randomly within the days_ahead range)
                days_offset = random.randint(1, days_ahead)
                hours_offset = random.randint(12, 21)  # Most matches are in the afternoon/evening
                minutes_offset = random.choice([0, 15, 30, 45])  # Matches typically start at :00, :15, :30, or :45
                
                start_time = datetime.now() + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
                
                # Create match object
                match = {
                    "id": f"example-{league_name}-{home_team}-{away_team}".replace(" ", "-").lower(),
                    "sport": "football",
                    "league": league,
                    "startTime": start_time.isoformat(),
                    "homeTeam": {
                        "id": hash(home_team) % 10000,
                        "name": home_team,
                        "ranking": home_rank,
                        "form": home_form
                    },
                    "awayTeam": {
                        "id": hash(away_team) % 10000,
                        "name": away_team,
                        "ranking": away_rank,
                        "form": away_form
                    },
                    "odds": {
                        "home": home_odds,
                        "draw": draw_odds,
                        "away": away_odds
                    }
                }
                
                matches.append(match)
        
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
        if not self.basketball_api_key:
            logger.info("No basketball API key. Using example data.")
            return self._get_example_basketball_matches(days_ahead)
        
        try:
            # Calculate date range
            start_date = datetime.now().strftime("%Y-%m-%d")
            end_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
            # SportRadar endpoint (example, replace with actual API)
            base_url = "https://api.sportradar.us/basketball/trial/v4/en"
            
            # In a real implementation, we'd have separate endpoints for NBA and EuroLeague
            # and handle the responses accordingly
            # For now, we'll just return example data
            
            logger.warning("Basketball API integration is not implemented. Using example data.")
            return self._get_example_basketball_matches(days_ahead)
            
        except Exception as e:
            logger.error(f"Error fetching basketball matches: {e}")
            return self._get_example_basketball_matches(days_ahead)
    
    def _get_example_basketball_matches(self, days_ahead=3):
        """Generate example basketball matches for demo purposes."""
        leagues = [
            {"id": 1, "name": "NBA", "country": "USA"},
            {"id": 2, "name": "EuroLeague", "country": "Europe"}
        ]
        
        teams = {
            "NBA": [
                "Los Angeles Lakers", "Boston Celtics", "Golden State Warriors", "Chicago Bulls", 
                "Miami Heat", "Brooklyn Nets", "Milwaukee Bucks", "Phoenix Suns",
                "Philadelphia 76ers", "Dallas Mavericks", "Denver Nuggets", "Atlanta Hawks",
                "New York Knicks", "Cleveland Cavaliers", "Memphis Grizzlies", "Portland Trail Blazers",
                "Toronto Raptors", "Utah Jazz", "Sacramento Kings", "Orlando Magic",
                "San Antonio Spurs", "New Orleans Pelicans", "Oklahoma City Thunder", "Minnesota Timberwolves",
                "Washington Wizards", "Detroit Pistons", "Charlotte Hornets", "Houston Rockets",
                "Indiana Pacers", "Los Angeles Clippers"
            ],
            "EuroLeague": [
                "Real Madrid", "CSKA Moscow", "FC Barcelona", "Anadolu Efes", 
                "Fenerbahce", "Olympiacos", "Bayern Munich", "Maccabi Tel Aviv",
                "Panathinaikos", "Zalgiris Kaunas", "Armani Milan", "Baskonia",
                "ALBA Berlin", "Red Star Belgrade", "Zenit St. Petersburg", "Khimki Moscow",
                "ASVEL Lyon-Villeurbanne", "Valencia Basket", "Olympia Ljubljana", "Monaco Basket"
            ]
        }
        
        matches = []
        
        # Generate 5-10 matches per league
        for league in leagues:
            league_name = league["name"]
            league_teams = teams.get(league_name, teams["NBA"])
            
            num_matches = random.randint(5, 10)
            for _ in range(num_matches):
                # Select two random teams
                home_team, away_team = random.sample(league_teams, 2)
                
                # Generate random rankings (1-15, 1 being best)
                home_rank = random.randint(1, 15)
                away_rank = random.randint(1, 15)
                
                # Generate form (W=Win, L=Loss) for last 10 matches
                home_form = "".join(random.choices("WL", k=10))
                away_form = "".join(random.choices("WL", k=10))
                
                # Generate offensive and defensive ratings
                home_offense = random.randint(95, 120)
                home_defense = random.randint(95, 120)
                away_offense = random.randint(95, 120)
                away_defense = random.randint(95, 120)
                
                # Generate odds based on rankings
                if home_rank < away_rank:
                    home_odds = round(1.3 + (home_rank / 15), 2)
                    away_odds = round(2.2 + (home_rank / 7), 2)
                else:
                    away_odds = round(1.3 + (away_rank / 15), 2)
                    home_odds = round(2.2 + (away_rank / 7), 2)
                
                # Generate match start time (randomly within the days_ahead range)
                days_offset = random.randint(1, days_ahead)
                hours_offset = random.randint(17, 22)  # Basketball games are typically in the evening
                minutes_offset = random.choice([0, 30])  # Games typically start at :00 or :30
                
                start_time = datetime.now() + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
                
                # Create match object
                match = {
                    "id": f"example-{league_name}-{home_team}-{away_team}".replace(" ", "-").lower(),
                    "sport": "basketball",
                    "league": league,
                    "startTime": start_time.isoformat(),
                    "homeTeam": {
                        "id": hash(home_team) % 10000,
                        "name": home_team,
                        "ranking": home_rank,
                        "form": home_form,
                        "offense": home_offense,
                        "defense": home_defense
                    },
                    "awayTeam": {
                        "id": hash(away_team) % 10000,
                        "name": away_team,
                        "ranking": away_rank,
                        "form": away_form,
                        "offense": away_offense,
                        "defense": away_defense
                    },
                    "odds": {
                        "home": home_odds,
                        "away": away_odds
                    }
                }
                
                matches.append(match)
        
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
        if sport == "football":
            return self.fetch_football_matches(days_ahead)
        elif sport == "basketball":
            return self.fetch_basketball_matches(days_ahead)
        else:
            logger.error(f"Unsupported sport: {sport}")
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
        
        # Football
        football_matches = self.fetch_football_matches(days_ahead)
        all_matches["football"] = football_matches
        
        # Basketball
        basketball_matches = self.fetch_basketball_matches(days_ahead)
        all_matches["basketball"] = basketball_matches
        
        return all_matches