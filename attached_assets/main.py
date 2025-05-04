from flask import Flask, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Sample endpoint to test OddsAPI
@app.route('/odds')
def get_odds():
    url = "https://api.the-odds-api.com/v4/sports/soccer_epl/odds"
    params = {
        'apiKey': os.getenv('ODDS_API_KEY'),
        'regions': 'uk',
        'markets': 'h2h',
        'oddsFormat': 'decimal'
    }
    response = requests.get(url, params=params)
    return jsonify(response.json())

# Sample endpoint to test TheSportsDB
@app.route('/livescore')
def get_livescore():
    url = f"https://www.thesportsdb.com/api/v1/json/{os.getenv('SPORTSDB_API_KEY')}/latestsoccer.php"
    response = requests.get(url)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
