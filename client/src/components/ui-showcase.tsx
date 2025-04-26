import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Badge } from "@/components/ui/badge";
import PredictionCard from "@/components/predictions/prediction-card";

export function UIShowcase() {
  const [progress, setProgress] = useState(45);
  const [isSaved, setIsSaved] = useState(false);
  const [isInAccumulator, setIsInAccumulator] = useState(false);

  // Mock prediction data for testing
  const samplePrediction = {
    id: "pred-1",
    matchId: "match-1",
    sport: "football",
    createdAt: new Date().toISOString(),
    homeTeam: "Manchester United",
    awayTeam: "Liverpool",
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    league: "Premier League",
    predictedOutcome: "HOME_WIN",
    confidence: 78,
    isPremium: true,
    valueBet: {
      outcome: "Home Win",
      odds: 2.1,
      value: 12.5,
      isRecommended: true
    },
    predictions: {
      "1X2": {
        outcome: "HOME_WIN",
        homeWin: { probability: 0.58, odds: 2.1 },
        draw: { probability: 0.24, odds: 3.5 },
        awayWin: { probability: 0.18, odds: 4.2 }
      },
      "BTTS": {
        outcome: "YES",
        probability: 0.72,
        odds: 1.8
      },
      "Over_Under": {
        line: 2,
        outcome: "OVER",
        probability: 0.65,
        odds: 1.9
      },
      "PredictedScore": {
        home: 2,
        away: 1,
        probability: 0.15
      }
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Custom UI Components</CardTitle>
          <CardDescription>Showcase of our enhanced UI components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Custom Progress</h3>
            <div className="space-y-4">
              <CustomProgress 
                value={progress} 
                className="w-full h-3" 
                indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
              />
              <CustomProgress 
                value={progress} 
                className="w-full h-3" 
                indicatorClassName="bg-gradient-to-r from-red-500 to-orange-500"
              />
              <CustomProgress 
                value={progress} 
                className="w-full h-3" 
                indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <div className="flex items-center gap-4">
                <Button onClick={() => setProgress(Math.max(0, progress - 10))}>
                  Decrease
                </Button>
                <Button onClick={() => setProgress(Math.min(100, progress + 10))}>
                  Increase
                </Button>
                <span>{progress}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Custom Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="premium">Premium</Badge>
              <Badge variant="value">Value Bet</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Prediction Card</CardTitle>
          <CardDescription>Interactive prediction card with expanded view</CardDescription>
        </CardHeader>
        <CardContent>
          <PredictionCard 
            prediction={samplePrediction}
            isSaved={isSaved}
            isInAccumulator={isInAccumulator}
            onSave={() => setIsSaved(!isSaved)}
            onAddToAccumulator={() => setIsInAccumulator(!isInAccumulator)}
            subscriptionStatus="premium"
          />
        </CardContent>
        <CardFooter className="flex justify-start gap-4">
          <Button 
            variant="outline"
            onClick={() => setIsSaved(!isSaved)}
          >
            {isSaved ? "Unsave" : "Save"} Prediction
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsInAccumulator(!isInAccumulator)}
          >
            {isInAccumulator ? "Remove from" : "Add to"} Accumulator
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}