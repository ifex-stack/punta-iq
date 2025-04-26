import React, { useState } from "react";
import { useLocation } from "wouter";
import { FaFutbol, FaBasketballBall } from "react-icons/fa";
import { 
  Trophy, 
  TrendingUp, 
  BarChart4,
  BarChart3,
  DollarSign,
  ChevronLeft,
  Grid2X2
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomProgress } from "@/components/ui/custom-progress";
import PredictionCard from "@/components/predictions/prediction-card";

// Sample prediction data for showcase
const sampleFootballPrediction = {
  id: "pred-1",
  matchId: "match-1",
  sport: "football",
  createdAt: new Date().toISOString(),
  homeTeam: "Arsenal",
  awayTeam: "Chelsea",
  startTime: new Date(Date.now() + 86400000).toISOString(),
  league: "Premier League",
  predictedOutcome: "HOME_WIN",
  confidence: 78,
  isPremium: false,
  predictions: {
    "1X2": {
      outcome: "HOME_WIN",
      homeWin: { probability: 0.78, odds: 1.92 },
      draw: { probability: 0.15, odds: 3.50 },
      awayWin: { probability: 0.07, odds: 4.10 },
    },
    "BTTS": {
      outcome: "YES",
      probability: 0.72,
      odds: 1.75,
      noOdds: 2.15
    },
    "Over_Under": {
      line: 2.5,
      outcome: "OVER",
      probability: 0.68,
      odds: 1.95,
      underOdds: 2.05
    },
    "PredictedScore": {
      home: 2,
      away: 1,
      probability: 0.24,
      odds: 8.50
    },
  },
  valueBet: {
    isRecommended: true,
    outcome: "Arsenal Win",
    odds: 1.92,
    value: 12.5
  }
};

const sampleBasketballPrediction = {
  id: "pred-4",
  matchId: "match-4",
  sport: "basketball",
  createdAt: new Date().toISOString(),
  homeTeam: "LA Lakers",
  awayTeam: "Brooklyn Nets",
  startTime: new Date(Date.now() + 86400000).toISOString(),
  league: "NBA",
  predictedOutcome: "HOME_WIN",
  confidence: 82,
  isPremium: true,
  predictions: {
    "Winner": {
      outcome: "HOME_WIN",
      homeWin: { probability: 0.82, odds: 1.65 },
      awayWin: { probability: 0.18, odds: 2.55 },
    },
    "TotalPoints": {
      line: 220.5,
      outcome: "OVER",
      probability: 0.74,
      predictedTotal: 232.5,
      odds: 1.90
    },
    "Spread": {
      line: 6.5,
      favored: "HOME_WIN",
      probability: 0.68,
      odds: 1.85
    },
    "PredictedScore": {
      home: 118,
      away: 109,
      probability: 0.15,
      odds: 12.00
    },
  }
};

export function UIShowcase() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("prediction-cards");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  
  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold">PuntaIQ UI Showcase</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="prediction-cards" className="flex items-center gap-1">
              <Grid2X2 className="h-4 w-4" />
              <span>Prediction Cards</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>UI Components</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="subscription-toggle">Subscription:</Label>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${subscriptionTier === "free" ? "font-bold" : ""}`}>Free</span>
              <Switch 
                id="subscription-toggle" 
                checked={subscriptionTier === "premium"}
                onCheckedChange={(checked) => setSubscriptionTier(checked ? "premium" : "free")}
              />
              <span className={`text-sm ${subscriptionTier === "premium" ? "font-bold" : ""}`}>Premium</span>
            </div>
          </div>
        </div>
        
        <TabsContent value="prediction-cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Football Prediction Card</h2>
              <PredictionCard 
                prediction={sampleFootballPrediction} 
                subscriptionStatus={subscriptionTier}
              />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">Basketball Prediction Card</h2>
              <PredictionCard 
                prediction={sampleBasketballPrediction} 
                subscriptionStatus={subscriptionTier}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Badge Components</CardTitle>
              <CardDescription>
                Custom badge variants for different states and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="premium">Premium</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="value">Value Bet</Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>With Icon</span>
                </Badge>
                <Badge variant="success" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Trending</span>
                </Badge>
                <Badge variant="premium" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Premium</span>
                </Badge>
                <Badge variant="value" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>Value Bet</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Progress Component</CardTitle>
              <CardDescription>
                Enhanced progress indicators with confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>High Confidence (85%+)</Label>
                    <span className="font-medium">88%</span>
                  </div>
                  <CustomProgress value={88} className="h-2" indicatorClassName="bg-green-500" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Medium Confidence (65-84%)</Label>
                    <span className="font-medium">75%</span>
                  </div>
                  <CustomProgress value={75} className="h-2" indicatorClassName="bg-yellow-500" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Low Confidence (Below 65%)</Label>
                    <span className="font-medium">55%</span>
                  </div>
                  <CustomProgress value={55} className="h-2" indicatorClassName="bg-red-500" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Custom Gradient Progress</Label>
                    <span className="font-medium">60%</span>
                  </div>
                  <CustomProgress 
                    value={60} 
                    className="h-3" 
                    indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sport-Specific Icons</CardTitle>
              <CardDescription>
                Icons for different sports in the prediction system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <FaFutbol className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Football</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <FaBasketballBall className="h-8 w-8 mb-2 text-orange-500" />
                  <span className="text-sm font-medium">Basketball</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <BarChart3 className="h-8 w-8 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">Tennis</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Trophy className="h-8 w-8 mb-2 text-amber-500" />
                  <span className="text-sm font-medium">Awards</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}