# PuntaIQ Replit Starter

This Replit project integrates:
- OddsAPI for real-time betting odds
- TheSportsDB for live scores
- Firebase (config-ready)
- Environment variable security using .env

## How to Run
1. Fill your API keys in the `.env` file.
2. Run `pip install -r requirements.txt`
3. Start the server with `python main.py`

## Endpoints
- `/odds` – Returns current EPL odds from OddsAPI
- `/livescore` – Returns recent live soccer scores from TheSportsDB
