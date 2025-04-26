import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Define types for prediction history data
type PredictionHistoryItem = {
  userPrediction: {
    id: number;
    userId: number;
    predictionId: number;
    viewedAt: string;
  };
  prediction: {
    id: number;
    matchId: number;
    predictedOutcome: string;
    confidence: number;
    isCorrect: boolean | null;
  };
  match: {
    id: number;
    leagueId: number;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    result: string | null;
  };
  league: {
    id: number;
    sportId: number;
    name: string;
  } | null;
};

export default function StatsPage() {
  const [sportFilter, setSportFilter] = useState<string>("all");
  
  // Fetch prediction history
  const { data: history, isLoading } = useQuery<PredictionHistoryItem[]>({
    queryKey: ["/api/predictions/history"],
  });
  
  // Calculate statistics
  const calculateStats = () => {
    if (!history) return { successRate: 0, totalPicks: 0, roi: 0 };
    
    const completedPredictions = history.filter(item => item.prediction.isCorrect !== null);
    const successfulPredictions = completedPredictions.filter(item => item.prediction.isCorrect === true);
    
    const successRate = completedPredictions.length > 0 
      ? Math.round((successfulPredictions.length / completedPredictions.length) * 100)
      : 0;
    
    // Simple ROI calculation based on theoretical 1 unit stakes
    let totalStake = completedPredictions.length;
    let totalReturns = 0;
    
    completedPredictions.forEach(item => {
      if (item.prediction.isCorrect) {
        // Assume average odds of 2.0 for successful predictions
        totalReturns += 2.0;
      }
    });
    
    const roi = totalStake > 0 
      ? Math.round(((totalReturns - totalStake) / totalStake) * 100) / 10
      : 0;
    
    return {
      successRate,
      totalPicks: history.length,
      roi: roi > 0 ? `+${roi}` : roi
    };
  };
  
  const stats = calculateStats();
  
  // Function to render the correct outcome badge
  const renderOutcomeBadge = (isCorrect: boolean | null) => {
    if (isCorrect === null) {
      return <span className="bg-muted bg-opacity-20 text-muted-foreground text-xs py-1 px-2 rounded">Pending</span>;
    } else if (isCorrect) {
      return <span className="bg-green-500 bg-opacity-20 text-green-500 text-xs py-1 px-2 rounded">Win</span>;
    } else {
      return <span className="bg-red-500 bg-opacity-20 text-red-500 text-xs py-1 px-2 rounded">Loss</span>;
    }
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Function to get the outcome text
  const getOutcomeText = (predictedOutcome: string) => {
    switch (predictedOutcome) {
      case "home":
        return "Home Win (1)";
      case "away":
        return "Away Win (2)";
      case "draw":
        return "Draw (X)";
      case "btts":
        return "Both Teams To Score";
      case "home_over2.5":
        return "Home Win & Over 2.5";
      default:
        if (predictedOutcome.includes("over")) {
          return `Over ${predictedOutcome.split("over")[1]}`;
        }
        return predictedOutcome;
    }
  };
  
  // Monthly performance data for the chart
  const monthlyPerformance = [
    { month: "Apr", successRate: 65 },
    { month: "May", successRate: 75 },
    { month: "Jun", successRate: 45 },
    { month: "Jul", successRate: 85 },
    { month: "Aug", successRate: 70 },
    { month: "Sep", successRate: 40 },
    { month: "Oct", successRate: 90 },
    { month: "Nov", successRate: 80 },
    { month: "Dec", successRate: 60 }
  ];
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 pt-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Your Prediction History</h2>
          
          {/* Performance overview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card rounded-lg p-3 text-center">
              <span className="text-sm text-muted-foreground block mb-1">Success Rate</span>
              <span className="text-xl font-bold text-green-500">{stats.successRate}%</span>
            </div>
            <div className="bg-card rounded-lg p-3 text-center">
              <span className="text-sm text-muted-foreground block mb-1">Total Picks</span>
              <span className="text-xl font-bold text-foreground">{stats.totalPicks}</span>
            </div>
            <div className="bg-card rounded-lg p-3 text-center">
              <span className="text-sm text-muted-foreground block mb-1">ROI</span>
              <span className="text-xl font-bold text-accent">{stats.roi}%</span>
            </div>
          </div>
          
          {/* Performance chart */}
          <div className="bg-card rounded-lg p-4 mb-6">
            <h3 className="text-md font-bold text-foreground mb-3">Monthly Performance</h3>
            <div className="accuracy-chart relative h-40">
              {monthlyPerformance.map((month, index) => (
                <div 
                  key={month.month}
                  className={`chart-bar absolute bottom-0 w-[8%] rounded-t-sm ${
                    month.successRate >= 60 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    height: `${month.successRate}%`, 
                    left: `${index * 10 + 5}%` 
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between px-2 mt-2">
              {monthlyPerformance.map(month => (
                <span key={month.month} className="text-xs text-muted-foreground">{month.month}</span>
              ))}
            </div>
          </div>
          
          {/* Recent predictions filter */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-foreground">Recent Predictions</h3>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-32 h-9 bg-card text-sm">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="soccer">Soccer</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="football">American Football</SelectItem>
                <SelectItem value="baseball">Baseball</SelectItem>
                <SelectItem value="hockey">Hockey</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Recent predictions list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-3 mb-6">
              {history.slice(0, 5).map((item) => (
                <div 
                  key={item.userPrediction.id} 
                  className={`bg-card rounded-lg p-3 border-l-4 ${
                    item.prediction.isCorrect === true 
                      ? 'border-green-500' 
                      : item.prediction.isCorrect === false 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {item.match.homeTeam} vs {item.match.awayTeam}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {item.league?.name} • {formatDate(item.userPrediction.viewedAt)}
                      </div>
                    </div>
                    {renderOutcomeBadge(item.prediction.isCorrect)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      AI Prediction: <span className="text-foreground">{getOutcomeText(item.prediction.predictedOutcome)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Confidence: <span className="text-foreground">{item.prediction.confidence}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No prediction history available</p>
            </div>
          )}
          
          <Button variant="outline" className="w-full py-3 text-foreground rounded-lg font-medium mb-6">
            View All History
          </Button>
        </div>
      </main>
      
      <BottomNavigation activePage="stats" />
    </div>
  );
}
