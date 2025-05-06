# PuntaIQ Replit Scheduler Setup

This document explains how to set up the automatic data caching and exporting process using Replit's Scheduler.

## Scripts Overview

We've created several specialized scripts to handle different aspects of data collection:

1. `cache_football_data.py` - Fetches and caches football fixtures data
2. `cache_basketball_data.py` - Fetches and caches NBA games data
3. `cache_odds_data.py` - Fetches and caches betting odds data
4. `export_training_data.py` - Exports cached data to CSV files for AI training

## Replit Scheduler Configuration

To set up these scripts to run automatically, follow these steps:

1. In Replit, click on the **Tools** tab in the left sidebar
2. Select **Scheduler**
3. Click **+ New Job**
4. Configure each job as follows:

### Job 1: Football Data Cache (Morning Update)
- **Command**: `python cache_football_data.py`
- **Schedule**: Daily at 6:00 AM UTC
- **Description**: "Daily football data cache update"

### Job 2: Basketball Data Cache
- **Command**: `python cache_basketball_data.py`
- **Schedule**: Daily at 7:00 AM UTC
- **Description**: "Daily basketball data cache update"

### Job 3: Odds Data Cache
- **Command**: `python cache_odds_data.py`
- **Schedule**: Daily at 8:00 AM UTC
- **Description**: "Daily odds data cache update"

### Job 4: Training Data Export
- **Command**: `python export_training_data.py`
- **Schedule**: Daily at 9:00 AM UTC
- **Description**: "Daily training data export"

### Job 5: Football Data Cache (Evening Update)
- **Command**: `python cache_football_data.py`
- **Schedule**: Daily at 6:00 PM UTC
- **Description**: "Evening football data cache update"

### Job 6: Odds Data Cache (Evening Update)
- **Command**: `python cache_odds_data.py`
- **Schedule**: Daily at 7:00 PM UTC
- **Description**: "Evening odds data cache update"

## Data Locations

The cached data and exported training datasets are stored in the following locations:

- **Cache directory**: `./cache/` - Contains all cached data organized by sport
- **Exports directory**: `./exports/` - Contains exported CSV files and manifest files

## Logs

Each script generates its own log file:

- `football_cache_log.txt` - Football cache updates log
- `basketball_cache_log.txt` - Basketball cache updates log
- `odds_cache_log.txt` - Odds cache updates log
- `training_export_log.txt` - Training data export log

## Testing

You can test any script manually by running it directly, for example:

```bash
python cache_football_data.py
```

Each script is designed to run independently and handle its own error logging.