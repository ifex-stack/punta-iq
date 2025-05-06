# PuntaIQ Sports Data System

This system handles automated sports data collection, caching, and training dataset generation for the PuntaIQ sports prediction platform.

## System Overview

The PuntaIQ data system consists of:

1. **Data Collection** - Scripts that fetch data from sports APIs and cache it locally
2. **Data Export** - Converts cached data into CSV training datasets for AI models
3. **Automation** - Uses Replit's scheduler to run these tasks automatically

## Components

### Data Collection Scripts

| Script | Description |
|--------|-------------|
| `cache_football_data.py` | Fetches football fixtures data from API-Football |
| `cache_basketball_data.py` | Fetches basketball games data from BallDontLie API |
| `cache_odds_data.py` | Fetches betting odds data from The Odds API |

### Data Export Scripts

| Script | Description |
|--------|-------------|
| `export_training_data.py` | Processes cached data into CSV training datasets |

### Automation

| Script | Description |
|--------|-------------|
| `replit_scheduler.py` | Coordinator script that can run all tasks |
| `SCHEDULER_SETUP.md` | Instructions for setting up the Replit scheduler |

## Data Flow

1. **API → Cache**: Sports data is fetched from APIs and stored in the `/cache` directory
2. **Cache → CSV**: Cached data is processed and exported to CSV files in the `/exports` directory
3. **CSV → AI Models**: Training data is used to train the AI prediction models

## API Sources

| Sport | API | Data Type |
|-------|-----|-----------|
| Football | API-Football | Fixtures, teams, leagues |
| Basketball | BallDontLie | NBA games, teams, players |
| Multiple | The Odds API | Betting odds, markets |

## Directory Structure

- `/cache` - Contains cached API responses organized by sport and date
- `/exports` - Contains CSV training datasets with timestamps
- `/logs` - Contains log files from each script

## Usage

### Manual Operation

Each script can be run independently:

```bash
python cache_football_data.py  # Fetch football data
python cache_basketball_data.py  # Fetch basketball data
python cache_odds_data.py  # Fetch odds data
python export_training_data.py  # Generate training datasets
```

### Automated Operation

Follow the instructions in `SCHEDULER_SETUP.md` to configure Replit's scheduler to run these tasks automatically.

## Security

- API keys are stored as environment variables
- Data is cached locally on the Replit instance
- No user data is collected or stored

## Logs and Monitoring

Each script generates a log file that records:
- Start and end times
- Data fetch results
- Error messages
- Summary of data processed

## Troubleshooting

If the system encounters issues:

1. Check the log files for error messages
2. Verify API keys are valid
3. Check Replit's scheduler for job status
4. Ensure there's enough storage space available