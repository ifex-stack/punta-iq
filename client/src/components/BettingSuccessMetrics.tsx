import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, BarChart3, Calendar, Badge } from "lucide-react";

interface BettingSuccessMetricsProps {
  recentSuccessRate: number;
  monthlySuccessRate: number;
  yearlySuccessRate: number;
  totalBets: number;
  streak: number;
  tier: string;
}

const BettingSuccessMetrics: React.FC<BettingSuccessMetricsProps> = ({
  recentSuccessRate,
  monthlySuccessRate,
  yearlySuccessRate,
  totalBets,
  streak,
  tier
}) => {
  // Function to determine color based on success rate
  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return "text-green-500";
    if (rate >= 55) return "text-amber-500";
    return "text-red-500";
  };

  // Function to determine progress bar color based on success rate
  const getProgressColor = (rate: number) => {
    if (rate >= 70) return "bg-green-500";
    if (rate >= 55) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Betting Success Metrics
        </CardTitle>
        <CardDescription>
          Track our AI prediction performance over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recent Success Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Recent Performance (7 days)
            </span>
            <span className={`text-sm font-bold ${getSuccessColor(recentSuccessRate)}`}>
              {recentSuccessRate}%
            </span>
          </div>
          <Progress 
            value={recentSuccessRate} 
            max={100} 
            className="h-2"
            indicatorClassName={getProgressColor(recentSuccessRate)} 
          />
        </div>

        {/* Monthly Success Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Monthly Performance
            </span>
            <span className={`text-sm font-bold ${getSuccessColor(monthlySuccessRate)}`}>
              {monthlySuccessRate}%
            </span>
          </div>
          <Progress 
            value={monthlySuccessRate} 
            max={100} 
            className="h-2"
            indicatorClassName={getProgressColor(monthlySuccessRate)} 
          />
        </div>

        {/* Yearly Success Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Yearly Performance
            </span>
            <span className={`text-sm font-bold ${getSuccessColor(yearlySuccessRate)}`}>
              {yearlySuccessRate}%
            </span>
          </div>
          <Progress 
            value={yearlySuccessRate} 
            max={100} 
            className="h-2" 
            indicatorClassName={getProgressColor(yearlySuccessRate)}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="space-y-1 text-center">
            <span className="text-xs text-muted-foreground">Total Predictions</span>
            <p className="text-xl font-bold">{totalBets.toLocaleString()}</p>
          </div>

          <div className="space-y-1 text-center">
            <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Current Streak
            </span>
            <p className="text-xl font-bold">{streak}</p>
          </div>

          <div className="space-y-1 text-center">
            <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Award className="h-3 w-3" /> Performance Tier
            </span>
            <p className="text-xl font-bold flex items-center justify-center">
              <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                {tier}
              </Badge>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingSuccessMetrics;