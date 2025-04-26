import { useState } from "react";
import EnhancedPredictionCard from "./enhanced-prediction-card";

// NOTE: This file is deprecated. Please use enhanced-prediction-card.tsx instead
// This interface is kept for backwards compatibility
export interface PredictionCardProps {
  prediction: {
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
    valueBet?: {
      outcome: string;
      odds: number;
      value: number;
      isRecommended: boolean;
    } | null;
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
      "BTTS_Over"?: {
        line: number;
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
      "CorrectScore"?: {
        outcome: string;
        probability: number;
        odds?: number;
        scores?: {
          home: number;
          away: number;
        }[];
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
      "HalfTime_FullTime"?: {
        outcome: string;
        probability: number;
        odds?: number;
        combinations?: {
          halfTime: string;
          fullTime: string;
          probability: number;
          odds?: number;
        }[];
      };
      "Double_Chance"?: {
        outcome: string;
        probability: number;
        odds?: number;
        combinations: {
          name: string;
          probability: number;
          odds?: number;
        }[];
      };
      "Win_To_Nil"?: {
        outcome: string;
        team: string;
        probability: number;
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
        probability?: number;
      };
    };
  };
  onSave?: (predictionId: string) => void;
  onAddToAccumulator?: (predictionId: string) => void;
  isSaved?: boolean;
  isInAccumulator?: boolean;
  subscriptionStatus?: "free" | "premium" | "none";
}

// This is just a wrapper around the EnhancedPredictionCard for backwards compatibility
export default function PredictionCard(props: PredictionCardProps) {
  // Simply forward all props to the enhanced card
  return <EnhancedPredictionCard {...props} />;
}