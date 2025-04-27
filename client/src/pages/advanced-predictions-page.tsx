import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Info, Check, AlertTriangle, TrendingUp, History, Scale, Award, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import footballMatchImage from "@/assets/football-match.svg";

// Match type definition
interface RealTimeMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  startTime: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  venue?: string;
}

const AdvancedPredictionsPage = () => {
  const [selectedMatch, setSelectedMatch] = useState<RealTimeMatch | null>(null);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("football");
  const { toast } = useToast();

  // Fetch available ML capabilities
  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery({
    queryKey: ["/api/predictions/advanced-capabilities"],
    queryFn: getQueryFn(),
  });
  
  // Fetch real-time football matches
  const { 
    data: footballMatches = [], 
    isLoading: isLoadingFootball,
    refetch: refetchFootball
  } = useQuery<RealTimeMatch[]>({
    queryKey: ["/api/predictions/real-time-matches", { sport: "football" }],
    queryFn: () => 
      fetch(`/api/predictions/real-time-matches?sport=football`)
        .then(res => res.json()),
  });
  
  // Fetch real-time basketball matches
  const { 
    data: basketballMatches = [], 
    isLoading: isLoadingBasketball,
    refetch: refetchBasketball
  } = useQuery<RealTimeMatch[]>({
    queryKey: ["/api/predictions/real-time-matches", { sport: "basketball" }],
    queryFn: () => 
      fetch(`/api/predictions/real-time-matches?sport=basketball`)
        .then(res => res.json()),
  });
  
  // Refresh all matches data
  const refreshMatches = () => {
    refetchFootball();
    refetchBasketball();
    toast({
      title: "Data Refreshed",
      description: "Match data has been updated with the latest information",
    });
  };

  const generateAdvancedPrediction = async (match: any) => {
    try {
      setGeneratingPrediction(true);
      setSelectedMatch(match);
      setPrediction(null);

      // Generate prediction with our advanced ML engine
      const response = await apiRequest(
        "POST", 
        "/api/predictions/advanced", 
        { 
          matchData: match,
          premium: false,
        }
      );
      
      const advancedPrediction = await response.json();
      setPrediction(advancedPrediction);
      
      toast({
        title: "Prediction Generated",
        description: `Advanced prediction for ${match.homeTeam} vs ${match.awayTeam} is ready`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating prediction:", error);
      toast({
        title: "Error",
        description: "Failed to generate prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPrediction(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Advanced Predictions
        </h1>
        <p className="text-muted-foreground">
          Powered by statistical models, historical trend analysis, and AI insights
        </p>
      </div>

      {capabilitiesLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Available Capabilities</CardTitle>
                <CardDescription>
                  Advanced prediction capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capabilities?.predictionMethods?.map((method: string) => (
                    <div key={method} className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-500" />
                      <span className="capitalize">{method.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Badge variant={capabilities?.aiEnhanced ? "default" : "outline"}>
                  {capabilities?.aiEnhanced ? "AI Enhanced" : "Standard Analysis"}
                </Badge>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Today's Matches</CardTitle>
                  <CardDescription>
                    Select a match to generate an advanced prediction
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={refreshMatches}
                  title="Refresh match data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="football">Football</TabsTrigger>
                    <TabsTrigger value="basketball">Basketball</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {activeTab === "football" && (
                  <>
                    {isLoadingFootball ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <Skeleton className="h-5 w-4/5" />
                                <Skeleton className="h-4 w-2/5" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : footballMatches.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <img 
                          src={footballMatchImage} 
                          alt="No football matches" 
                          className="h-24 mx-auto opacity-40" 
                        />
                        <p className="text-muted-foreground">No football matches available today</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {footballMatches.map((match) => (
                          <Card
                            key={match.id}
                            className={`cursor-pointer transition-colors hover:bg-muted ${
                              selectedMatch?.id === match.id ? "border-primary" : ""
                            }`}
                            onClick={() => generateAdvancedPrediction(match)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{match.homeTeam} vs {match.awayTeam}</p>
                                  <p className="text-sm text-muted-foreground">{match.league}</p>
                                </div>
                                {match.status && <Badge>{match.status}</Badge>}
                                {match.homeOdds && match.awayOdds && (
                                  <div className="text-xs text-muted-foreground">
                                    {match.homeOdds.toFixed(2)} | {match.drawOdds?.toFixed(2) || "-"} | {match.awayOdds.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === "basketball" && (
                  <>
                    {isLoadingBasketball ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <Skeleton className="h-5 w-4/5" />
                                <Skeleton className="h-4 w-2/5" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : basketballMatches.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <p className="text-muted-foreground">No basketball matches available today</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {basketballMatches.map((match) => (
                          <Card
                            key={match.id}
                            className={`cursor-pointer transition-colors hover:bg-muted ${
                              selectedMatch?.id === match.id ? "border-primary" : ""
                            }`}
                            onClick={() => generateAdvancedPrediction(match)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{match.homeTeam} vs {match.awayTeam}</p>
                                  <p className="text-sm text-muted-foreground">{match.league}</p>
                                </div>
                                {match.status && <Badge>{match.status}</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {generatingPrediction ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">
                    Generating advanced prediction...
                  </p>
                  <p className="text-sm text-center text-muted-foreground max-w-md">
                    Our advanced ML engine is analyzing historical data, team form, and statistical models
                    to generate the most accurate prediction.
                  </p>
                </div>
              </Card>
            ) : prediction ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {prediction.homeTeam} vs {prediction.awayTeam}
                      </CardTitle>
                      <CardDescription>
                        {prediction.league} | {new Date(prediction.startTime).toLocaleString()}
                      </CardDescription>
                    </div>
                    {prediction.isAiEnhanced && (
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        AI Enhanced
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="markets">Markets</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      {prediction.historicalInsights && (
                        <TabsTrigger value="historical">Historical</TabsTrigger>
                      )}
                      {prediction.aiAnalysis && (
                        <TabsTrigger value="ai">AI Insights</TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Prediction</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {prediction.predictedOutcome === 'H' && prediction.homeTeam}
                              {prediction.predictedOutcome === 'D' && 'Draw'}
                              {prediction.predictedOutcome === 'A' && prediction.awayTeam}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <div className="text-2xl font-bold">{prediction.confidence}%</div>
                              <Progress value={prediction.confidence} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Score Prediction</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {prediction.predictions.PredictedScore.home} - {prediction.predictions.PredictedScore.away}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Methods Used</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {prediction.predictionMethods.map((method: string) => (
                              <Badge key={method} variant="outline" className="capitalize">
                                {method.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="markets" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Match Winner (1X2)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center p-4 border rounded-md">
                              <div className="text-lg font-semibold">{prediction.homeTeam}</div>
                              <div className="mt-2 text-2xl font-bold">
                                {prediction.predictions['1X2'].homeWin.probability}%
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Odds: {prediction.predictions['1X2'].homeWin.odds}
                              </div>
                            </div>

                            <div className="flex flex-col items-center p-4 border rounded-md">
                              <div className="text-lg font-semibold">Draw</div>
                              <div className="mt-2 text-2xl font-bold">
                                {prediction.predictions['1X2'].draw.probability}%
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Odds: {prediction.predictions['1X2'].draw.odds}
                              </div>
                            </div>

                            <div className="flex flex-col items-center p-4 border rounded-md">
                              <div className="text-lg font-semibold">{prediction.awayTeam}</div>
                              <div className="mt-2 text-2xl font-bold">
                                {prediction.predictions['1X2'].awayWin.probability}%
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Odds: {prediction.predictions['1X2'].awayWin.odds}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Both Teams To Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xl font-bold mb-1">
                                  {prediction.predictions.BTTS.outcome}
                                </div>
                                <Progress value={prediction.predictions.BTTS.probability} className="h-2 w-[200px]" />
                              </div>
                              <div className="text-2xl font-bold">
                                {prediction.predictions.BTTS.probability}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Over/Under 2.5 Goals</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xl font-bold mb-1">
                                  {prediction.predictions.Over_Under.outcome} {prediction.predictions.Over_Under.line}
                                </div>
                                <Progress value={prediction.predictions.Over_Under.probability} className="h-2 w-[200px]" />
                              </div>
                              <div className="text-2xl font-bold">
                                {prediction.predictions.Over_Under.probability}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Analysis Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {prediction.analysisFactors.map((factor: any, index: number) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {factor.impact === 'high' && <TrendingUp className="w-5 h-5 mr-2 text-red-500" />}
                                  {factor.impact === 'medium' && <Info className="w-5 h-5 mr-2 text-amber-500" />}
                                  {factor.impact === 'low' && <Info className="w-5 h-5 mr-2 text-blue-500" />}
                                  <span>{factor.factor}</span>
                                </div>
                                <Badge variant={
                                  factor.impact === 'high' ? "destructive" :
                                  factor.impact === 'medium' ? "default" : "outline"
                                }>
                                  {factor.impact}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {prediction.historicalInsights && (
                      <TabsContent value="historical" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Head-to-Head Record</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {prediction.historicalInsights.headToHead.available ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-lg font-semibold">{prediction.homeTeam} Wins</div>
                                    <div className="text-3xl font-bold mt-2">
                                      {prediction.historicalInsights.headToHead.results.homeWins}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {prediction.historicalInsights.headToHead.percentages.homeWin}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-lg font-semibold">Draws</div>
                                    <div className="text-3xl font-bold mt-2">
                                      {prediction.historicalInsights.headToHead.results.draws}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {prediction.historicalInsights.headToHead.percentages.draw}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-lg font-semibold">{prediction.awayTeam} Wins</div>
                                    <div className="text-3xl font-bold mt-2">
                                      {prediction.historicalInsights.headToHead.results.awayWins}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {prediction.historicalInsights.headToHead.percentages.awayWin}%
                                    </div>
                                  </div>
                                </div>
                                <div className="pt-2">
                                  <div className="text-sm font-medium">Recent Trend</div>
                                  <div className="mt-1">{prediction.historicalInsights.headToHead.results.recentTrend}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center p-4 text-muted-foreground">
                                <History className="w-5 h-5 mr-2" />
                                <span>No head-to-head data available</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>{prediction.homeTeam} Form</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {prediction.historicalInsights.recentForm.home.available ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xl font-mono tracking-widest">
                                      {prediction.historicalInsights.recentForm.home.formString}
                                    </div>
                                    <div className="text-sm text-muted-foreground">(recent first)</div>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <div>Win rate: {prediction.historicalInsights.recentForm.home.winPercentage}%</div>
                                    <div>Last {prediction.historicalInsights.recentForm.home.matches} matches</div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-2">
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Wins</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.home.results.wins}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Draws</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.home.results.draws}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Losses</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.home.results.losses}</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                  <History className="w-5 h-5 mr-2" />
                                  <span>No recent form data available</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>{prediction.awayTeam} Form</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {prediction.historicalInsights.recentForm.away.available ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xl font-mono tracking-widest">
                                      {prediction.historicalInsights.recentForm.away.formString}
                                    </div>
                                    <div className="text-sm text-muted-foreground">(recent first)</div>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <div>Win rate: {prediction.historicalInsights.recentForm.away.winPercentage}%</div>
                                    <div>Last {prediction.historicalInsights.recentForm.away.matches} matches</div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-2">
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Wins</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.away.results.wins}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Draws</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.away.results.draws}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded-md">
                                      <div className="text-xs text-muted-foreground">Losses</div>
                                      <div className="font-bold">{prediction.historicalInsights.recentForm.away.results.losses}</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                  <History className="w-5 h-5 mr-2" />
                                  <span>No recent form data available</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    )}

                    {prediction.aiAnalysis && (
                      <TabsContent value="ai" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>AI Match Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">Summary</h4>
                              <p>{prediction.aiAnalysis.matchAnalysis?.summary}</p>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">{prediction.homeTeam} Strengths</h4>
                                <ul className="space-y-1">
                                  {prediction.aiAnalysis.matchAnalysis?.homeTeamStrengths?.map((strength: string, i: number) => (
                                    <li key={i} className="flex items-start">
                                      <Check className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">{prediction.awayTeam} Weaknesses</h4>
                                <ul className="space-y-1">
                                  {prediction.aiAnalysis.matchAnalysis?.awayTeamWeaknesses?.map((weakness: string, i: number) => (
                                    <li key={i} className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 mr-2 mt-1 text-amber-500 flex-shrink-0" />
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            {prediction.aiAnalysis.bettingAdvice && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-medium mb-2">Value Bets</h4>
                                  {prediction.aiAnalysis.bettingAdvice.valueBets?.length > 0 ? (
                                    <div className="space-y-2">
                                      {prediction.aiAnalysis.bettingAdvice.valueBets.map((bet: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                                          <div className="flex items-center">
                                            <Scale className="w-4 h-4 mr-2 text-green-500" />
                                            <span>{bet.market}: {bet.selection}</span>
                                          </div>
                                          <Badge variant="outline">
                                            {bet.confidence}% confidence
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No value bets identified</p>
                                  )}
                                </div>
                              </>
                            )}
                            
                            <div className="bg-muted p-3 rounded-md text-xs flex items-center">
                              <Info className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span>
                                Analysis generated using {prediction.modelUsed || "AI model"} with 
                                enhanced statistical techniques and historical data analysis
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrediction(null);
                      setSelectedMatch(null);
                    }}
                  >
                    Back to matches
                  </Button>
                  
                  <Badge variant={prediction.isPremium ? "default" : "outline"}>
                    {prediction.isPremium ? "Premium" : "Free"}
                  </Badge>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Prediction Engine</CardTitle>
                  <CardDescription>
                    Our advanced prediction engine combines statistical models, 
                    historical data analysis, and AI-powered insights to provide more accurate predictions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Statistical Models</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          Utilizes advanced statistical models including Poisson distributions and ELO ratings
                          to calculate match outcomes with high precision.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Historical Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          Deep analysis of head-to-head records, recent form, and historical performance
                          to identify patterns and trends.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-100 dark:border-emerald-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">AI-Enhanced Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {capabilities?.aiEnhanced 
                            ? "Advanced AI analysis provides explainable predictions with key insights and value bet identification."
                            : "AI enhancement unavailable. Enable OpenAI integration for advanced insights."}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-500" />
                      How to use
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select a match from the left panel to generate an advanced prediction.
                      The prediction includes detailed market analysis, historical insights, and
                      AI-powered explanations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPredictionsPage;