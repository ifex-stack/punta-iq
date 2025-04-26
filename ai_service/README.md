# AI Sports Prediction Microservice

This Python-based microservice is responsible for generating AI-powered sports predictions for the Sports Prediction Platform.

## Features

- 🏆 Fetch sports data from multiple APIs (API-Football, SportRadar)
- 🧠 Machine learning models for prediction generation
- 📊 Support for multiple prediction markets (1X2, Over/Under, BTTS, etc.)
- 📱 Firebase integration for storage and notifications
- ⚙️ Automated execution via cloud functions

## Architecture

The service is composed of several modules:

- `main.py`: Orchestration module that runs the entire pipeline
- `data_fetcher.py`: Handles fetching sports data from APIs
- `predictor.py`: Contains ML models and prediction logic
- `storage.py`: Manages storing predictions in Firebase
- `cloud_function.py`: Cloud function entry point for automated execution
- `config.py`: Configuration and Firebase initialization
- `generate_training_data.py`: Utility to generate training data

## Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Create a `.env` file based on `.env.example` with your API keys and Firebase credentials

## Usage

### Running Locally

```bash
# Generate predictions for the next 3 days
python main.py --days 3

# Generate predictions without storing to Firebase
python main.py --no-store

# Generate predictions without sending notifications
python main.py --no-notify

# Save predictions to a JSON file
python main.py --output predictions.json
```

### Training Models

```bash
# Generate synthetic training data
python generate_training_data.py

# Train models (uncomment the train_and_save_models() call in generate_training_data.py)
```

### Deploying to Cloud Functions

1. Create a Google Cloud Function
2. Set the entry point to `predict_daily`
3. Set up a Cloud Scheduler job to trigger the function daily

## Environment Variables

- `API_FOOTBALL_KEY`: API key for API-Football
- `SPORTRADAR_KEY`: API key for SportRadar
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Firebase client email
- `FIREBASE_DATABASE_URL`: Firebase database URL
- `PREDICTION_SCHEDULE`: Cron schedule for predictions (default: "0 0 * * *")

## Prediction Flow

1. Fetch upcoming matches for all enabled sports
2. Apply machine learning models to generate predictions
3. Calculate confidence scores for each prediction
4. Generate accumulators of different sizes (2, 5, 10 matches)
5. Store predictions in Firebase Firestore
6. Send notifications to users about new predictions

## Adding New Sports

To add a new sport, update the `SUPPORTED_SPORTS` dictionary in `config.py` and implement the corresponding fetching and prediction methods.

## License

Copyright © 2025 AI Sports Predictions