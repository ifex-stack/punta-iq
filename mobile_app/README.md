# AI Sports Predictions Mobile App

A React Native mobile application for the AI Sports Predictions platform.

## Features

- 📱 Cross-platform (iOS and Android) mobile application
- 🔐 User authentication and account management
- 🏆 Daily sports predictions across multiple sports
- 📊 Historical prediction tracking and statistics
- 💰 In-app subscription management with Stripe
- 🔔 Push notifications for new predictions and results

## Tech Stack

- React Native (Expo-based)
- TypeScript
- Firebase (Authentication, Firestore, FCM)
- Stripe React Native SDK
- Victory Native (for charts)
- NativeBase UI components

## Project Structure

```
mobile_app/
├── assets/            # Images, fonts, and other static assets
├── src/
│   ├── api/           # API services and data fetching
│   ├── components/    # Reusable UI components
│   ├── config/        # App configuration
│   ├── contexts/      # React contexts for state management
│   ├── hooks/         # Custom React hooks
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # App screens
│   ├── services/      # Firebase, push notifications, etc.
│   ├── theme/         # Styling and theming
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── App.tsx            # Main app component
└── app.json           # Expo configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Emulator

### Installation

1. Clone the repository
2. Install dependencies: `npm install` or `yarn install`
3. Create a `.env` file based on `.env.example`
4. Start the development server: `expo start`

### Running on Devices

- iOS simulator: `expo start --ios`
- Android emulator: `expo start --android`
- Physical device: Scan QR code from Expo Go app

## Subscription Tiers

The app offers three subscription tiers:

1. **Basic** ($9.99/month)
   - Access to 1 sport
   - Limited to 2-fold accumulators
   - Basic statistics dashboard

2. **Pro** ($19.99/month)
   - Access to all sports
   - 2 and 5-fold accumulators
   - Advanced statistics dashboard
   - Priority notifications

3. **Elite** ($29.99/month)
   - All sports with highest accuracy predictions
   - 2, 5, and 10-fold accumulators
   - Premium statistical analysis
   - Instant alerts for high-value opportunities

## Push Notifications

The app uses Firebase Cloud Messaging (FCM) to deliver notifications for:

- New daily predictions
- Match results
- Subscription status updates
- Special offers and promotions

Users can customize their notification preferences in the app settings.

## License

Copyright © 2025 AI Sports Predictions