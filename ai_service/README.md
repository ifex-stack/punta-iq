# PuntaIQ AI Sports Prediction Service

This is the AI microservice component for the PuntaIQ application, responsible for:
- Fetching sports data from various APIs
- Storing data in Firebase
- Running predictive models
- Providing a REST API for the main application

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- Firebase account with Realtime Database
- API keys for the sports data services

### Installation

1. Clone this repository
2. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your API keys and configuration

   ```shell
   cp .env.example .env
   # Then edit .env with your actual API keys
   ```

3. Set up Firebase:
   - Option 1: Create a `serviceAccountKey.json` file with your Firebase credentials
   - Option 2: Add your Firebase credentials JSON to the `.env` file (FIREBASE_CRED_JSON)

4. Install dependencies:
   ```shell
   pip install -r requirements.txt
   ```

### Quick Start

Use the provided setup script:

```shell
./setup_and_run.sh
```

Or run manually:

```shell
# Activate virtual environment (if using one)
source venv/bin/activate

# Run the service
python main.py
```

## Usage

The service offers multiple run modes:

```shell
# Run the API server (default)
python main.py

# Run just the cron jobs
python main.py --mode cron

# Run integration tests
python main.py --mode test
```

## API Endpoints

The service exposes the following endpoints:

- `/status` - Check service status
- `/check-api-status` - Trigger check of all API connections
- `/sports` - List available sports
- `/odds/{sport}` - Get odds for a specific sport
- `/livescore` - Get live scores for in-progress matches
- `/fixtures/league/{league_id}` - Get fixtures for a specific league
- `/teams/{league_id}` - Get teams for a specific league
- `/leagues` - Get available leagues

## Supported Sports Data Providers

- API-Football - Football/soccer data
- TheSportsDB - Multi-sport data
- BallDontLie - NBA basketball data

## Environment Variables

See `.env.example` for a list of all configurable environment variables.

## Troubleshooting

If you encounter issues:

1. Check the logs in `ai_service.log`
2. Verify your API keys are correct
3. Ensure Firebase credentials are properly configured
4. Run in test mode to verify API connections: `python main.py --mode test`