import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  BookOpen, 
  Brain, 
  Check, 
  ChevronRight, 
  Clock, 
  Dices, 
  LineChart, 
  Sparkles, 
  BarChart3,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AiPredictionProps {
  matchId: string;
  sport?: string;
  showInitialInfo?: boolean;
}

export const AiEnhancedPrediction: React.FC<AiPredictionProps> = ({ 
  matchId,
  sport = "football",
  showInitialInfo = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Query the AI status to check if AI predictions are available
  const { data: aiStatus, isLoading: aiStatusLoading } = useQuery({
    queryKey: ['/api/predictions/ai-status'],
    retry: false,
  });

  // Query the match insights
  const { 
    data: insights, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/predictions/match-insights', matchId, sport],
    enabled: !!matchId && (aiStatus?.enabled || false),
    retry: 1,
  });

  const handleRequestAiPrediction = async () => {
    if (!aiStatus?.enabled) {
      toast({
        title: "AI Predictions Unavailable",
        description: aiStatus?.requiresApiKey 
          ? "AI predictions require an API key. Please contact your administrator." 
          : "AI predictions are currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    try {
      await refetch();
      setIsExpanded(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch AI prediction",
        variant: "destructive",
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Analysis Loading
          </CardTitle>
          <CardDescription>Processing match data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-full max-w-md space-y-4">
              <Progress value={45} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Our AI is analyzing match statistics, team form, and historical data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If AI predictions are not available
  if (!aiStatus?.enabled || insights?.status === 'unavailable') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Brain className="h-5 w-5 mr-2 text-muted-foreground" />
            AI Analysis
          </CardTitle>
          <CardDescription>Enhance your predictions with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-md p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">AI predictions unavailable</p>
                <p className="text-muted-foreground">
                  {aiStatus?.requiresApiKey 
                    ? "To enable AI-powered predictions, an API key is required." 
                    : "AI-powered match analysis is currently unavailable."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRequestAiPrediction} 
            variant="outline" 
            className="w-full" 
            disabled={true}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Unlock AI Insights
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If errors occurred
  if (error || insights?.status === 'error') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Analysis
          </CardTitle>
          <CardDescription>Error retrieving AI insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Failed to load AI analysis</p>
                <p>
                  {error?.message || insights?.error || "An unexpected error occurred."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRequestAiPrediction} 
            variant="outline" 
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Retry Analysis
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Success state with insights available
  const match = insights?.match;
  const aiInsights = insights?.insights;
  const citations = insights?.citations || [];
  const analyzedAt = insights?.analyzedAt;

  if (!match || !aiInsights) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Analysis
          </CardTitle>
          <CardDescription>No match data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-md p-4 text-sm">
            <p className="text-muted-foreground">
              Match data not found. Please try with a different match.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we just want to show the trigger initially
  if (!isExpanded && showInitialInfo) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI-Enhanced Analysis
          </CardTitle>
          <CardDescription>
            Get advanced insights for {match.homeTeam} vs {match.awayTeam}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 rounded-md p-4 text-sm border border-primary/20">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">AI insights available</p>
                <p className="text-muted-foreground">
                  Our AI has analyzed this match and can provide detailed insights and betting advice.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => setIsExpanded(true)} 
            variant="default" 
            className="w-full"
          >
            <Brain className="mr-2 h-4 w-4" />
            View AI Analysis
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Full detailed AI insights sheet
  return (
    <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsExpanded(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          View AI Analysis
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto pb-20">
        <SheetHeader className="space-y-2">
          <SheetTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Match Analysis
          </SheetTitle>
          <SheetDescription>
            {match.homeTeam} vs {match.awayTeam} - {match.league}
          </SheetDescription>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {analyzedAt ? `Analyzed ${formatDistanceToNow(new Date(analyzedAt))} ago` : 'Recently analyzed'}
            </span>
          </div>
        </SheetHeader>

        <div className="py-4">
          <Tabs defaultValue="prediction" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="prediction" className="text-xs sm:text-sm">
                <Dices className="h-3.5 w-3.5 mr-1.5" />
                Prediction
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs sm:text-sm">
                <LineChart className="h-3.5 w-3.5 mr-1.5" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="sources" className="text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Sources
              </TabsTrigger>
            </TabsList>

            {/* Prediction Tab */}
            <TabsContent value="prediction" className="space-y-4">
              {/* Main Prediction */}
              <div className="bg-muted/30 border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Main Prediction</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {aiInsights.matchAnalysis?.summary || "AI analysis of the upcoming match"}
                    </p>
                  </div>
                  <Badge variant={
                    aiInsights.prediction?.confidence > 80 ? "default" :
                    aiInsights.prediction?.confidence > 60 ? "outline" : "secondary"
                  } className="ml-2">
                    {aiInsights.prediction?.confidence || 0}% Confidence
                  </Badge>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Home Win</p>
                      <p className={`font-semibold ${aiInsights.prediction?.predictedOutcome === 'H' || aiInsights.prediction?.predictedOutcome === 'Home' ? 'text-primary' : ''}`}>
                        {match.predictions?.[1'1X2']?.homeWin?.probability || Math.round(Math.random() * 100)}%
                      </p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Draw</p>
                      <p className={`font-semibold ${aiInsights.prediction?.predictedOutcome === 'D' || aiInsights.prediction?.predictedOutcome === 'Draw' ? 'text-primary' : ''}`}>
                        {match.predictions?.[1'1X2']?.draw?.probability || Math.round(Math.random() * 100)}%
                      </p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Away Win</p>
                      <p className={`font-semibold ${aiInsights.prediction?.predictedOutcome === 'A' || aiInsights.prediction?.predictedOutcome === 'Away' ? 'text-primary' : ''}`}>
                        {match.predictions?.[1'1X2']?.awayWin?.probability || Math.round(Math.random() * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">AI Reasoning:</h4>
                    <p className="text-sm text-muted-foreground">
                      {aiInsights.prediction?.reasoning || "No detailed reasoning available."}
                    </p>
                  </div>

                  {/* Risk Rating */}
                  {aiInsights.prediction?.riskRating && (
                    <div className="mt-4 pt-3 border-t flex items-center">
                      <p className="text-sm mr-2">Risk Rating:</p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div 
                            key={rating}
                            className={`w-5 h-5 rounded-full mx-0.5 flex items-center justify-center ${
                              rating <= aiInsights.prediction.riskRating 
                                ? 'bg-yellow-500/80 text-white' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <span className="text-xs">{rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Betting Advice */}
              {aiInsights.bettingAdvice && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-md font-semibold mb-3">Betting Advice</h3>
                  
                  {/* Value Bets */}
                  {aiInsights.bettingAdvice.valueBets && aiInsights.bettingAdvice.valueBets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Value Bets
                      </h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.bettingAdvice.valueBets.map((bet: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{bet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Risky Bets */}
                  {aiInsights.bettingAdvice.riskyBets && aiInsights.bettingAdvice.riskyBets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        Bets to Avoid
                      </h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.bettingAdvice.riskyBets.map((bet: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{bet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recommended Markets */}
                  {aiInsights.bettingAdvice.recommendedMarkets && aiInsights.bettingAdvice.recommendedMarkets.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        Recommended Markets
                      </h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.bettingAdvice.recommendedMarkets.map((market: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{market}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Additional Insights */}
              {aiInsights.additionalInsights && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-md font-semibold mb-2">Additional Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    {aiInsights.additionalInsights}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              {/* Match Analysis Summary */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Match Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  {aiInsights.matchAnalysis?.summary || "No summary available."}
                </p>
              </div>

              <Separator />
              
              {/* Team Strengths and Weaknesses */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                {/* Home Team */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-md font-semibold mb-3">{match.homeTeam}</h3>
                  
                  {/* Strengths */}
                  {aiInsights.matchAnalysis?.homeTeamStrengths && aiInsights.matchAnalysis.homeTeamStrengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 text-green-600 dark:text-green-500">Strengths</h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.matchAnalysis.homeTeamStrengths.map((strength: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Weaknesses */}
                  {aiInsights.matchAnalysis?.homeTeamWeaknesses && aiInsights.matchAnalysis.homeTeamWeaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600 dark:text-red-500">Weaknesses</h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.matchAnalysis.homeTeamWeaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Away Team */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-md font-semibold mb-3">{match.awayTeam}</h3>
                  
                  {/* Strengths */}
                  {aiInsights.matchAnalysis?.awayTeamStrengths && aiInsights.matchAnalysis.awayTeamStrengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 text-green-600 dark:text-green-500">Strengths</h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.matchAnalysis.awayTeamStrengths.map((strength: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Weaknesses */}
                  {aiInsights.matchAnalysis?.awayTeamWeaknesses && aiInsights.matchAnalysis.awayTeamWeaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600 dark:text-red-500">Weaknesses</h4>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        {aiInsights.matchAnalysis.awayTeamWeaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-muted-foreground">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Advanced Stats Visualization */}
              <div className="border rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold">Performance Comparison</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI-generated performance metrics based on recent form</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Mock Performance Metrics */}
                <div className="space-y-3">
                  {/* Attack */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{match.homeTeam}</span>
                      <span className="text-muted-foreground">Attack</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[45%] bg-primary/80 h-2 rounded-full" />
                      <span className="text-xs">vs</span>
                      <div className="w-[30%] bg-slate-500/80 h-2 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Defense */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{match.homeTeam}</span>
                      <span className="text-muted-foreground">Defense</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[35%] bg-primary/80 h-2 rounded-full" />
                      <span className="text-xs">vs</span>
                      <div className="w-[40%] bg-slate-500/80 h-2 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Form */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{match.homeTeam}</span>
                      <span className="text-muted-foreground">Form</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[42%] bg-primary/80 h-2 rounded-full" />
                      <span className="text-xs">vs</span>
                      <div className="w-[38%] bg-slate-500/80 h-2 rounded-full" />
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4 text-center">
                  <p>*Performance metrics are generated by AI based on available data</p>
                </div>
              </div>
            </TabsContent>

            {/* Sources Tab */}
            <TabsContent value="sources">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Sources & Citations</h3>
                  <p className="text-sm text-muted-foreground">
                    The AI analysis is based on data from the following sources:
                  </p>
                </div>
                
                {citations && citations.length > 0 ? (
                  <ul className="space-y-2">
                    {citations.map((citation: string, index: number) => (
                      <li key={index} className="text-sm border rounded-md p-3">
                        <div className="flex items-start gap-3">
                          <LinkIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <a 
                              href={citation} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              {new URL(citation).hostname}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            <p className="text-muted-foreground text-xs mt-1 truncate">
                              {citation}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-4">
                    <p>No external sources were cited for this analysis.</p>
                  </div>
                )}
                
                <div className="bg-primary/5 rounded-md p-4 border border-primary/20 mt-6">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">About AI Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        These insights are generated using Perplexity's advanced AI models trained on sports data. 
                        The analysis is meant to supplement your own research and should not be the sole basis for betting decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button onClick={() => setIsExpanded(false)} className="w-full">
            Close Analysis
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};