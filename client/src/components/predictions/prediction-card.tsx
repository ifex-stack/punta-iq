import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { BookmarkIcon, BookmarkPlus, Share2, TrendingUp, ChevronDown, ChevronUp, Award, Heart, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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
      };
      "Over_Under"?: {
        line: number;
        outcome: string;
        probability: number;
      };
      "CorrectScore"?: {
        outcome: string;
        probability: number;
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
      };
      "Spread"?: {
        line: number;
        favored: string;
        probability: number;
      };
      "PredictedScore"?: {
        home: number;
        away: number;
      };
    };
  };
  onSave?: (predictionId: string) => void;
  onAddToAccumulator?: (predictionId: string) => void;
  isSaved?: boolean;
  isInAccumulator?: boolean;
  subscriptionStatus?: "free" | "premium" | "none";
}

export default function PredictionCard({ 
  prediction, 
  onSave, 
  onAddToAccumulator,
  isSaved = false,
  isInAccumulator = false,
  subscriptionStatus = "free" 
}: PredictionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [inAccumulator, setInAccumulator] = useState(isInAccumulator);
  const { toast } = useToast();
  
  const matchDate = new Date(prediction.startTime);
  const isFootball = prediction.sport === "football";
  const isBasketball = prediction.sport === "basketball";
  
  const predictions1X2 = prediction.predictions["1X2"];
  const predictionsWinner = prediction.predictions["Winner"];
  const mainPrediction = predictions1X2 || predictionsWinner;
  
  const primaryMarket = isFootball ? "1X2" : "Winner";
  const outcomeDisplay = 
    prediction.predictedOutcome === "H" ? "Home" :
    prediction.predictedOutcome === "D" ? "Draw" :
    prediction.predictedOutcome === "A" ? "Away" : prediction.predictedOutcome;
  
  const formatOdds = (odds: number) => odds.toFixed(2);
  
  const getOutcomeTeam = () => {
    if (prediction.predictedOutcome === "H") return prediction.homeTeam;
    if (prediction.predictedOutcome === "A") return prediction.awayTeam;
    return "Draw";
  };
  
  const getGradientByConfidence = (confidence: number) => {
    if (confidence > 80) return "from-green-500 to-emerald-700";
    if (confidence > 65) return "from-blue-500 to-cyan-700";
    if (confidence > 50) return "from-amber-500 to-orange-700";
    return "from-red-500 to-rose-700";
  };
  
  const handleSave = () => {
    setSaved(!saved);
    if (onSave) {
      onSave(prediction.id);
    }
    
    toast({
      title: !saved ? "Prediction Saved" : "Prediction Removed",
      description: !saved 
        ? "This prediction has been saved to your bookmarks" 
        : "This prediction has been removed from your bookmarks",
    });
  };
  
  const handleAddToAccumulator = () => {
    setInAccumulator(!inAccumulator);
    if (onAddToAccumulator) {
      onAddToAccumulator(prediction.id);
    }
    
    toast({
      title: !inAccumulator ? "Added to Accumulator" : "Removed from Accumulator",
      description: !inAccumulator 
        ? "This prediction has been added to your accumulator" 
        : "This prediction has been removed from your accumulator",
    });
  };
  
  const isPredictionLocked = prediction.isPremium && subscriptionStatus !== "premium";
  
  return (
    <Card className="w-full mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal">
                {prediction.league}
              </Badge>
              <Badge 
                variant={prediction.isPremium ? "premium" : "secondary"} 
                className={cn(
                  "text-xs font-medium",
                  prediction.isPremium && "bg-gradient-to-r from-amber-400 to-yellow-600 text-white"
                )}
              >
                {prediction.isPremium ? "PREMIUM" : "FREE"}
              </Badge>
              {prediction.valueBet?.isRecommended && (
                <Badge variant="value" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                  VALUE BET
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-bold flex items-center gap-1">
              {prediction.homeTeam} 
              <span className="text-muted-foreground mx-1">vs</span> 
              {prediction.awayTeam}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {format(matchDate, "dd MMM yyyy, HH:mm")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 pb-1">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Prediction:</div>
              <div className="font-medium flex items-center">
                <span className="mr-2">{primaryMarket}:</span>
                <Badge className="font-bold">
                  {outcomeDisplay} {isFootball && prediction.predictedOutcome !== "D" ? `(${getOutcomeTeam()})` : ""}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1 text-right">
              <div className="text-sm text-muted-foreground">Confidence:</div>
              <div className="font-bold bg-gradient-to-r bg-clip-text text-transparent text-lg 
                           from-blue-500 to-cyan-700">
                {prediction.confidence}%
              </div>
            </div>
          </div>
          
          <Progress 
            value={prediction.confidence} 
            className="h-2" 
            indicatorClassName={cn("bg-gradient-to-r", getGradientByConfidence(prediction.confidence))} 
          />
          
          {mainPrediction && !isPredictionLocked && (
            <div className="grid grid-cols-3 gap-2 my-3">
              {isFootball && (
                <>
                  <div className={cn(
                    "text-center p-2 rounded-lg",
                    prediction.predictedOutcome === "H" && "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 ring-1 ring-green-500/50"
                  )}>
                    <div className="text-sm">Home</div>
                    <div className="font-bold">{formatOdds(mainPrediction.homeWin.odds)}</div>
                    <div className="text-xs text-muted-foreground">({mainPrediction.homeWin.probability}%)</div>
                  </div>
                  <div className={cn(
                    "text-center p-2 rounded-lg",
                    prediction.predictedOutcome === "D" && "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 ring-1 ring-amber-500/50"
                  )}>
                    <div className="text-sm">Draw</div>
                    <div className="font-bold">{formatOdds(mainPrediction.draw.odds)}</div>
                    <div className="text-xs text-muted-foreground">({mainPrediction.draw.probability}%)</div>
                  </div>
                  <div className={cn(
                    "text-center p-2 rounded-lg",
                    prediction.predictedOutcome === "A" && "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 ring-1 ring-blue-500/50"
                  )}>
                    <div className="text-sm">Away</div>
                    <div className="font-bold">{formatOdds(mainPrediction.awayWin.odds)}</div>
                    <div className="text-xs text-muted-foreground">({mainPrediction.awayWin.probability}%)</div>
                  </div>
                </>
              )}
              
              {isBasketball && (
                <>
                  <div className={cn(
                    "text-center p-2 rounded-lg col-span-3/2",
                    prediction.predictedOutcome === "H" && "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 ring-1 ring-green-500/50"
                  )}>
                    <div className="text-sm">Home</div>
                    <div className="font-bold">{formatOdds(mainPrediction.homeWin.odds)}</div>
                    <div className="text-xs text-muted-foreground">({mainPrediction.homeWin.probability}%)</div>
                  </div>
                  <div className={cn(
                    "text-center p-2 rounded-lg col-span-3/2",
                    prediction.predictedOutcome === "A" && "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 ring-1 ring-blue-500/50"
                  )}>
                    <div className="text-sm">Away</div>
                    <div className="font-bold">{formatOdds(mainPrediction.awayWin.odds)}</div>
                    <div className="text-xs text-muted-foreground">({mainPrediction.awayWin.probability}%)</div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {isPredictionLocked && (
            <div className="bg-muted/50 p-3 rounded-md flex flex-col items-center justify-center my-3 space-y-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-center font-medium">
                Premium prediction locked. Upgrade your subscription to view details.
              </p>
              <Button variant="premium" size="sm" className="mt-1">
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {!isPredictionLocked && (
        <>
          <div 
            className="px-4 py-2 text-sm font-medium text-center cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide details" : "View details"}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {expanded && (
            <div className="px-4 py-3 bg-muted/20 border-t">
              <div className="space-y-3">
                {isFootball && (
                  <>
                    {prediction.predictions["BTTS"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Both Teams To Score:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={prediction.predictions["BTTS"].outcome === "Yes" ? "success" : "outline"}>
                            {prediction.predictions["BTTS"].outcome}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({prediction.predictions["BTTS"].probability}%)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {prediction.predictions["Over_Under"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Over/Under {prediction.predictions["Over_Under"].line}:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={prediction.predictions["Over_Under"].outcome === "Over" ? "success" : "outline"}>
                            {prediction.predictions["Over_Under"].outcome}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({prediction.predictions["Over_Under"].probability}%)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {prediction.predictions["CorrectScore"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Correct Score:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-bold">
                            {prediction.predictions["CorrectScore"].outcome}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({prediction.predictions["CorrectScore"].probability}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {isBasketball && (
                  <>
                    {prediction.predictions["TotalPoints"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Points {prediction.predictions["TotalPoints"].line}:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={prediction.predictions["TotalPoints"].outcome === "Over" ? "success" : "outline"}>
                            {prediction.predictions["TotalPoints"].outcome}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({prediction.predictions["TotalPoints"].probability}%)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {prediction.predictions["Spread"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Spread ({prediction.predictions["Spread"].line}):</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {prediction.predictions["Spread"].favored === "H" ? "Home" : "Away"} -{prediction.predictions["Spread"].line}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({prediction.predictions["Spread"].probability}%)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {prediction.predictions["PredictedScore"] && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Predicted Score:</span>
                        <Badge variant="secondary" className="font-bold">
                          {prediction.predictions["PredictedScore"].home} - {prediction.predictions["PredictedScore"].away}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
                
                {prediction.valueBet && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Value Bet Identified</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Outcome:</span>
                        <span className="font-medium ml-2">
                          {prediction.valueBet.outcome === "H" ? "Home" :
                           prediction.valueBet.outcome === "D" ? "Draw" : "Away"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Odds:</span>
                        <span className="font-medium ml-2">
                          {formatOdds(prediction.valueBet.odds)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium ml-2 text-green-600">
                          +{prediction.valueBet.value}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      <CardFooter className="flex items-center justify-between p-3 border-t">
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSave}>
                  {saved ? (
                    <BookmarkIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <BookmarkPlus className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{saved ? "Remove from bookmarks" : "Save prediction"}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleAddToAccumulator} disabled={isPredictionLocked}>
                  {inAccumulator ? (
                    <Award className="h-5 w-5 text-primary" />
                  ) : (
                    <Award className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{inAccumulator ? "Remove from accumulator" : "Add to accumulator"}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share prediction</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Heart className="h-4 w-4" />
                <span>94%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>94% of users found this prediction helpful</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}