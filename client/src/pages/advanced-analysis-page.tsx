import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, RefreshCw, Share2, Zap, TrendingUp, BarChart4, Calendar, Activity, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

// Types to match what we're getting from the API
interface Prediction {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  venue: string | null;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  score: {
    home: number | null;
    away: number | null;
  };
  prediction: string;
  confidence: number;
  explanation: string;
  valueBet?: {
    market: string;
    selection: string;
    odds: number;
    value: number;
  };
  // New fields for advanced analysis
  h2hHistory?: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    winner: string;
  }>;
  formGuide?: {
    home: Array<string>;
    away: Array<string>;
  };
  injuryNews?: Array<{
    team: string;
    player: string;
    status: string;
    impact: string;
  }>;
  aiEnhancedAnalysis?: string;
  performanceChart?: Array<{
    month: string;
    predictedCorrect: number;
    accuracy: number;
  }>;
}

export default function AdvancedAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  
  // On first load, check if we have prediction data in session storage
  useEffect(() => {
    const storedPrediction = sessionStorage.getItem('selectedPrediction');
    
    if (storedPrediction) {
      try {
        const predictionData = JSON.parse(storedPrediction) as Prediction;
        setPrediction(predictionData);
        
        // Simulate fetching additional data for the analysis
        setTimeout(() => {
          enhancePredictionWithAnalysis(predictionData);
        }, 1000);
      } catch (error) {
        console.error('Failed to parse prediction data', error);
        toast({
          title: "Error",
          description: "Failed to load prediction data",
          variant: "destructive",
        });
      }
    } else {
      // No prediction selected, redirect back
      toast({
        title: "No prediction selected",
        description: "Please select a prediction to view detailed analysis",
        variant: "destructive",
      });
      setLocation("/predictions");
    }
  }, []);
  
  // Function to enhance prediction with advanced analysis data
  const enhancePredictionWithAnalysis = (predictionData: Prediction) => {
    // Simulate API call for historical performance data
    const enhancedPrediction: Prediction = {
      ...predictionData,
      h2hHistory: [
        { date: "2024-10-15", homeTeam: predictionData.homeTeam, awayTeam: predictionData.awayTeam, score: "2-1", winner: predictionData.homeTeam },
        { date: "2024-05-22", homeTeam: predictionData.awayTeam, awayTeam: predictionData.homeTeam, score: "0-0", winner: "Draw" },
        { date: "2023-11-30", homeTeam: predictionData.homeTeam, awayTeam: predictionData.awayTeam, score: "3-1", winner: predictionData.homeTeam },
        { date: "2023-04-12", homeTeam: predictionData.awayTeam, awayTeam: predictionData.homeTeam, score: "2-0", winner: predictionData.awayTeam },
      ],
      formGuide: {
        home: ["W", "D", "W", "L", "W"],
        away: ["W", "W", "D", "D", "L"],
      },
      injuryNews: [
        { team: predictionData.homeTeam, player: "John Smith", status: "Doubtful", impact: "Medium" },
        { team: predictionData.awayTeam, player: "Carlos Rodriguez", status: "Out", impact: "High" },
      ],
      aiEnhancedAnalysis: `Based on our AI-powered analysis, ${predictionData.homeTeam} has shown strong home form recently with ${
        predictionData.formGuide?.home.filter(result => result === "W").length || 3
      } wins in their last 5 games. However, ${predictionData.awayTeam} has demonstrated resilience in away matches.
      
      The historical matchups between these teams favor ${
        predictionData.h2hHistory?.filter(h2h => h2h.winner === predictionData.homeTeam).length || 2 > 
        predictionData.h2hHistory?.filter(h2h => h2h.winner === predictionData.awayTeam).length || 1 ? 
        predictionData.homeTeam : predictionData.awayTeam
      }, but recent form and tactical changes suggest this could be a closely contested match.
      
      Our model gives ${predictionData.homeTeam} a ${predictionData.confidence}% chance to win, which represents value against the current market odds.`,
      performanceChart: [
        { month: "Nov", predictedCorrect: 12, accuracy: 75 },
        { month: "Dec", predictedCorrect: 15, accuracy: 68 },
        { month: "Jan", predictedCorrect: 18, accuracy: 72 },
        { month: "Feb", predictedCorrect: 14, accuracy: 70 },
        { month: "Mar", predictedCorrect: 16, accuracy: 73 },
        { month: "Apr", predictedCorrect: 20, accuracy: 77 },
      ]
    };
    
    setPrediction(enhancedPrediction);
    setLoading(false);
  };
  
  // Function to handle refresh of analysis
  const handleRefreshAnalysis = () => {
    setRefreshing(true);
    
    // Simulate refreshing data
    setTimeout(() => {
      if (prediction) {
        enhancePredictionWithAnalysis(prediction);
        toast({
          title: "Analysis Refreshed",
          description: "The prediction analysis has been updated with the latest data",
        });
      }
      setRefreshing(false);
    }, 1500);
  };
  
  // Function to load performance history
  const handleLoadPerformanceHistory = () => {
    setLoadingPerformance(true);
    
    // Simulate loading performance data
    setTimeout(() => {
      setLoadingPerformance(false);
    }, 1500);
  };
  
  // Function to share analysis
  const handleShareAnalysis = () => {
    // Copy a shareable link to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "A shareable link has been copied to your clipboard",
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/predictions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Predictions
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-60" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-52 mb-2" />
            <Skeleton className="h-5 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-60" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If somehow we have no prediction data
  if (!prediction) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <Info className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">No Prediction Selected</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please select a prediction from the predictions page to view detailed analysis.
              </p>
              <Button onClick={() => setLocation("/predictions")}>
                Go to Predictions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-5xl animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/predictions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Advanced Analysis</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleShareAnalysis}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share this analysis with others</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleRefreshAnalysis} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Update analysis with latest data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{prediction.homeTeam} vs {prediction.awayTeam}</CardTitle>
              <CardDescription>{prediction.league} • {new Date(prediction.startTime).toLocaleString()}</CardDescription>
            </div>
            <Badge 
              className={
                prediction.confidence >= 75 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                prediction.confidence >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
              }
            >
              {prediction.confidence}% Confidence
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-muted-foreground">
              Prediction: <span className="font-medium text-foreground">{prediction.prediction}</span>
            </div>
            {prediction.valueBet && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/60">
                {prediction.valueBet.value}% Value Bet
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="analysis">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="stats">Match Stats</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-900/60">
                <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950/30">
                  <CardTitle className="text-base flex items-center text-blue-700 dark:text-blue-400">
                    <Zap className="h-4 w-4 mr-2" />
                    AI-Enhanced Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-line">{prediction.aiEnhancedAnalysis}</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Head-to-Head History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {prediction.h2hHistory && prediction.h2hHistory.length > 0 ? (
                      <ul className="space-y-2">
                        {prediction.h2hHistory.map((match, index) => (
                          <li key={index} className="text-sm p-2 border-b border-border/40 last:border-b-0">
                            <div className="flex justify-between">
                              <span>{new Date(match.date).toLocaleDateString()}</span>
                              <span 
                                className={
                                  match.winner === prediction.homeTeam ? "text-green-600 dark:text-green-400" :
                                  match.winner === prediction.awayTeam ? "text-red-600 dark:text-red-400" :
                                  "text-blue-600 dark:text-blue-400"
                                }
                              >
                                {match.score}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {match.homeTeam} vs {match.awayTeam}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm py-2">No historical data available</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                      Recent Form Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {prediction.formGuide ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{prediction.homeTeam}</span>
                            <span className="text-xs text-muted-foreground">Last 5 matches</span>
                          </div>
                          <div className="flex space-x-1">
                            {prediction.formGuide.home.map((result, index) => (
                              <div 
                                key={index}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                  result === 'W' ? 'bg-green-500 dark:bg-green-600' :
                                  result === 'D' ? 'bg-blue-500 dark:bg-blue-600' :
                                  'bg-red-500 dark:bg-red-600'
                                }`}
                              >
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{prediction.awayTeam}</span>
                            <span className="text-xs text-muted-foreground">Last 5 matches</span>
                          </div>
                          <div className="flex space-x-1">
                            {prediction.formGuide.away.map((result, index) => (
                              <div 
                                key={index}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                  result === 'W' ? 'bg-green-500 dark:bg-green-600' :
                                  result === 'D' ? 'bg-blue-500 dark:bg-blue-600' :
                                  'bg-red-500 dark:bg-red-600'
                                }`}
                              >
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm py-2">No form data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {prediction.injuryNews && prediction.injuryNews.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                      Injury & Team News
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="divide-y divide-border">
                      {prediction.injuryNews.map((news, index) => (
                        <li key={index} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{news.player}</p>
                            <p className="text-xs text-muted-foreground">{news.team}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              news.status === 'Out' ? 'border-red-200 text-red-600 dark:border-red-800' :
                              news.status === 'Doubtful' ? 'border-yellow-200 text-yellow-600 dark:border-yellow-800' :
                              'border-green-200 text-green-600 dark:border-green-800'
                            }
                          >
                            {news.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <p className="text-muted-foreground text-sm">Odds</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs text-muted-foreground mb-1">1</p>
                          <p className="font-medium">{prediction.homeOdds?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs text-muted-foreground mb-1">X</p>
                          <p className="font-medium">{prediction.drawOdds?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs text-muted-foreground mb-1">2</p>
                          <p className="font-medium">{prediction.awayOdds?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <p className="text-muted-foreground text-sm">Prediction</p>
                      <div className="flex flex-col items-center">
                        <p className="text-xl font-medium">{prediction.prediction}</p>
                        {prediction.valueBet && (
                          <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                            <Zap className="h-3 w-3" />
                            <span>Value Bet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-1">
                        <p className="text-muted-foreground text-sm">Confidence</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs">
                                Confidence score reflects our AI model's certainty in this prediction, 
                                based on statistical analysis, historical data, and current form.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="space-y-2">
                        <Progress value={prediction.confidence} className="h-2" />
                        <p className="font-medium">{prediction.confidence}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {prediction.valueBet && (
                <Card className="border-green-200 dark:border-green-900/60">
                  <CardHeader className="pb-2 bg-green-50 dark:bg-green-950/30">
                    <CardTitle className="text-base flex items-center text-green-700 dark:text-green-400">
                      <Zap className="h-4 w-4 mr-2" />
                      Value Bet Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Market</p>
                        <p className="font-medium">{prediction.valueBet.market}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Selection</p>
                        <p className="font-medium">{prediction.valueBet.selection}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Odds</p>
                        <p className="font-medium">{prediction.valueBet.odds.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Value Rating</p>
                        <p className="font-medium text-green-600 dark:text-green-400">{prediction.valueBet.value}%</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm">
                        Our model has identified a {prediction.valueBet.value}% edge in this market, suggesting 
                        the true probability is higher than what the odds reflect. This represents a positive expected value bet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <BarChart4 className="h-4 w-4 mr-2 text-muted-foreground" />
                    Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm mb-4">{prediction.explanation}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">{prediction.homeTeam} Strengths</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Strong home record with consistent performances</li>
                        <li>Solid defensive organization</li>
                        <li>Effective at set pieces</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">{prediction.awayTeam} Strengths</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Fast counter-attacking style</li>
                        <li>Good recent away form</li>
                        <li>Creating quality scoring chances</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    Prediction Performance History
                  </CardTitle>
                  <CardDescription>
                    Historical performance of similar predictions over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPerformance ? (
                    <div className="h-72 flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading performance data...</p>
                      </div>
                    </div>
                  ) : prediction.performanceChart ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={prediction.performanceChart}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis domain={[40, 100]} />
                          <RechartsTooltip
                            formatter={(value, name) => {
                              if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                              return [value, 'Predictions'];
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorAccuracy)"
                          />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No performance data available</p>
                      <Button 
                        variant="outline"
                        className="mt-4"
                        onClick={handleLoadPerformanceHistory}
                      >
                        Load Performance History
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Success Rate by Market</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Match Result', rate: 72 },
                            { name: 'Over/Under', rate: 68 },
                            { name: 'Both Teams', rate: 75 },
                            { name: 'Double Chance', rate: 82 },
                          ]}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip
                            formatter={(value) => [`${value}%`, 'Success Rate']}
                          />
                          <Bar dataKey="rate" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Success Rate by Confidence</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { confidence: '50-59%', rate: 55 },
                            { confidence: '60-69%', rate: 63 },
                            { confidence: '70-79%', rate: 76 },
                            { confidence: '80-89%', rate: 85 },
                            { confidence: '90%+', rate: 92 },
                          ]}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="confidence" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip
                            formatter={(value) => [`${value}%`, 'Success Rate']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setLocation("/predictions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Predictions
        </Button>
        <Button onClick={handleShareAnalysis}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Analysis
        </Button>
      </div>
    </div>
  );
}