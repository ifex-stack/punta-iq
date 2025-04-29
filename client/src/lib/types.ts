// Shared types for the application

export interface Prediction {
  id: string;
  matchId: string;
  sport: string;
  createdAt: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  predictedOutcome: string;
  confidence: number;
  isPremium: boolean;
  isAiEnhanced?: boolean;
  modelUsed?: string;
  predictionMethods?: string[];
  valueBet?: {
    outcome: string;
    odds: number;
    value: number;
    isRecommended: boolean;
  } | null;
  historicalInsights?: {
    headToHead: any;
    recentForm: any;
    confidenceAdjustment: number;
  };
  aiAnalysis?: {
    prediction?: {
      outcome: string;
      confidence: number;
    };
    matchAnalysis?: {
      homeTeamStrengths: string[];
      homeTeamWeaknesses: string[];
      awayTeamStrengths: string[];
      awayTeamWeaknesses: string[];
    };
    explanation?: string;
    bettingAdvice?: {
      valueBets?: Array<{market: string; selection: string; odds: number}>;
      riskRating?: number;
      stakeAdvice?: string;
    };
  };
  predictions: {
    "1X2"?: {
      outcome: string;
      homeWin: { probability: number; odds: number };
      draw: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
    "BTTS"?: {
      outcome: string;
      probability: number;
      odds?: number;
    };
    "Over_Under"?: {
      line: number;
      outcome: string;
      probability: number;
      odds?: number;
    };
    "Over_Under_2.5"?: {
      line: number;
      outcome: string;
      probability: number;
      odds?: number;
    };
    "CorrectScore"?: {
      outcome: string;
      probability: number;
      odds?: number;
    };
    "Winner"?: {
      outcome: string;
      homeWin: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
    "TotalPoints"?: {
      line: number;
      outcome: string;
      probability: number;
      predictedTotal: number;
      odds?: number;
    };
    "Spread"?: {
      line: number;
      favored: string;
      probability: number;
      odds?: number;
    };
    "PredictedScore"?: {
      home: number;
      away: number;
    };
    "Corners_Over_Under"?: {
      line: number;
      outcome: string;
      probability: number;
      odds?: number;
      predictedCorners?: {
        home: number;
        away: number;
        total: number;
      };
    };
    "Cards_Over_Under"?: {
      line: number;
      outcome: string;
      probability: number;
      odds?: number;
      predictedCards?: {
        home: number;
        away: number;
        total: number;
      };
    };
    "RedCard"?: {
      outcome: string;
      probability: number;
      odds?: number;
    };
    "FirstHalfGoal"?: {
      outcome: string;
      probability: number;
      odds?: number;
    };
  };
  analysisFactors?: Array<{factor: string; impact: string}>;
}

export interface Accumulator {
  id: string;
  createdAt: string;
  size: number;
  totalOdds: number;
  confidence: number;
  isPremium: boolean;
  selections: Array<{
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    startTime: string;
    sport: string;
    market: string;
    outcome: string;
    odds: number;
    confidence: number;
  }>;
  type?: string;
  explanation?: string;
  riskRating?: number;
  isAiEnhanced?: boolean;
}

export interface AccumulatorsResponse {
  small: Accumulator[];
  medium: Accumulator[];
  large: Accumulator[];
  mega: Accumulator[];
}

export interface PredictionStats {
  overall: {
    totalPredictions: number;
    successfulPredictions: number;
    successRate: number;
    pendingPredictions: number;
    avgConfidence?: number;
    avgOdds?: number;
    potentialROI?: string;
    bestSport?: string;
    bestSportRate?: string;
  };
  userStats: {
    totalViewed: number;
    successfulPredictions: number;
    successRate: number;
  };
  historicalData: Array<{
    month: string;
    successRate: number;
    totalPredictions: number;
    correctPredictions: number;
  }>;
  marketTypes: Array<{
    market: string;
    successRate: number;
    totalPredictions: number;
  }>;
}

export interface SportStats {
  sport: {
    id: number;
    name: string;
    icon: string;
    isActive: boolean;
  };
  stats: {
    totalPredictions: number;
    successfulPredictions: number;
    successRate: number;
  };
}