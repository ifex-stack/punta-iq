import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Bookmark as BookmarkIcon,
  PlusSquare,
  Trophy,
  Clock,
  ArrowUpDown,
  DollarSign,
  Lock,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { FaFutbol } from "react-icons/fa";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PredictionCardProps = {
  prediction: any;
  isSaved?: boolean;
  isInAccumulator?: boolean;
  onSave?: (id: string) => void;
  onAddToAccumulator?: (id: string) => void;
  subscriptionStatus?: string;
};

export default function PredictionCard({ 
  prediction, 
  isSaved = false,
  isInAccumulator = false,
  onSave,
  onAddToAccumulator,
  subscriptionStatus = "free"
}: PredictionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate if prediction should be locked based on subscription
  const isLocked = prediction.isPremium && subscriptionStatus !== "premium";
  
  // Determine if showing main market (1X2 for football or Winner for basketball)
  const mainMarket = true;

  // Parse the date for display
  const matchDate = new Date(prediction.startTime);
  const formattedDate = format(matchDate, "dd MMM yyyy");
  const formattedTime = format(matchDate, "HH:mm");

  // Get display color based on confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "bg-green-500";
    if (confidence >= 65) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Determine sport icon
  const getSportIcon = () => {
    if (prediction.sport === "football") {
      return <FaFutbol className="h-4 w-4 text-muted-foreground" />;
    } else {
      return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Format prediction description
  const getPredictionDescription = () => {
    if (prediction.sport === "football" && prediction.predictions["1X2"]) {
      const outcome = prediction.predictions["1X2"].outcome;
      return `${outcome === "HOME_WIN" ? prediction.homeTeam : outcome === "AWAY_WIN" ? prediction.awayTeam : "Draw"} to ${outcome === "DRAW" ? "draw" : "win"}`;
    } else if (prediction.sport === "basketball" && prediction.predictions["Winner"]) {
      const outcome = prediction.predictions["Winner"].outcome;
      return `${outcome === "HOME_WIN" ? prediction.homeTeam : prediction.awayTeam} to win`;
    }
    return prediction.predictedOutcome;
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      expanded ? "shadow-lg" : "shadow",
      isLocked ? "opacity-95" : ""
    )}>
      <CardHeader className="px-4 py-3 bg-muted/30">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {getSportIcon()}
              <span className="text-sm font-medium text-muted-foreground">
                {prediction.league}
              </span>
              {prediction.isPremium && (
                <Badge variant={subscriptionStatus === "premium" ? "secondary" : "premium"} className="ml-2">
                  Premium
                </Badge>
              )}
              {prediction.valueBet?.isRecommended && (
                <Badge variant="value" className="ml-1">
                  Value Bet
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-bold">
              {prediction.homeTeam} vs {prediction.awayTeam}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              {formattedDate} · {formattedTime}
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave?.(prediction.id);
                    }}
                  >
                    <BookmarkIcon
                      className={cn(
                        "h-4 w-4",
                        isSaved ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isSaved ? "Remove from saved" : "Save prediction"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToAccumulator?.(prediction.id);
                    }}
                  >
                    <PlusSquare
                      className={cn(
                        "h-4 w-4",
                        isInAccumulator ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isInAccumulator ? "Remove from accumulator" : "Add to accumulator"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pt-3 pb-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="col-span-3">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium">AI Confidence</div>
              <div className="text-sm font-bold">{prediction.confidence}%</div>
            </div>
            <CustomProgress 
              value={prediction.confidence} 
              className="h-2" 
              indicatorClassName={getConfidenceColor(prediction.confidence)}
            />
          </div>
          
          <div className="flex flex-col items-center justify-center border rounded-md p-2">
            {isLocked ? (
              <>
                <Lock className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Premium</span>
              </>
            ) : mainMarket ? (
              <>
                <div className="text-xs text-muted-foreground">Odds</div>
                <div className="text-lg font-bold">
                  {prediction.predictions["1X2"] ? 
                    (prediction.predictions["1X2"].outcome === "HOME_WIN" ? 
                      prediction.predictions["1X2"].homeWin.odds : 
                      prediction.predictions["1X2"].outcome === "AWAY_WIN" ? 
                        prediction.predictions["1X2"].awayWin.odds : 
                        prediction.predictions["1X2"].draw.odds).toFixed(2) : 
                    (prediction.predictions["Winner"]?.outcome === "HOME_WIN" ? 
                      prediction.predictions["Winner"].homeWin.odds : 
                      prediction.predictions["Winner"]?.awayWin.odds).toFixed(2)}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="text-lg font-bold">
                  {prediction.predictions["PredictedScore"] ? 
                    `${prediction.predictions["PredictedScore"].home}-${prediction.predictions["PredictedScore"].away}` : 
                    "-"}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <Trophy className="h-4 w-4 mr-1.5 text-primary" />
            <h3 className="font-bold">AI Prediction</h3>
          </div>
          <div className="flex items-center justify-between mb-1 px-2 py-1.5 bg-muted/30 rounded-md">
            <div>
              <span className="font-medium">{getPredictionDescription()}</span>
            </div>
            {!isLocked && prediction.valueBet?.isRecommended && (
              <div className="flex items-center">
                <Badge variant="success" className="mr-1">
                  <DollarSign className="h-3 w-3 mr-0.5" />
                  <span>Value</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {!isLocked && prediction.valueBet && (
          <div className="mb-4 p-2 border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 rounded-md">
            <div className="flex items-center mb-1">
              <TrendingUp className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
              <h3 className="font-bold text-sm text-green-700 dark:text-green-400">Value Bet Analysis</h3>
            </div>
            <div className="text-sm text-green-800 dark:text-green-300">
              <div className="flex justify-between mb-1">
                <span>Market:</span>
                <span className="font-medium">{prediction.valueBet.outcome}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Odds:</span>
                <span className="font-medium">{prediction.valueBet.odds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Value Rating:</span>
                <span className="font-medium">{prediction.valueBet.value > 0 ? '+' : ''}{prediction.valueBet.value.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs" 
          onClick={() => setExpanded(!expanded)}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
          {expanded ? "Show less" : "Show more markets"}
        </Button>
        
        {expanded && !isLocked && (
          <div className="mt-3">
            <Accordion type="single" collapsible className="w-full">
              {prediction.predictions["1X2"] && (
                <AccordionItem value="1x2" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">1X2 Market</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["1X2"].outcome === "HOME_WIN" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium truncate">{prediction.homeTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {(prediction.predictions["1X2"].homeWin.probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">
                          {prediction.predictions["1X2"].homeWin.odds.toFixed(2)}
                        </div>
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["1X2"].outcome === "DRAW" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Draw</div>
                        <div className="text-sm text-muted-foreground">
                          {(prediction.predictions["1X2"].draw.probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">
                          {prediction.predictions["1X2"].draw.odds.toFixed(2)}
                        </div>
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["1X2"].outcome === "AWAY_WIN" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium truncate">{prediction.awayTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {(prediction.predictions["1X2"].awayWin.probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">
                          {prediction.predictions["1X2"].awayWin.odds.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["BTTS"] && (
                <AccordionItem value="btts" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Both Teams to Score</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["BTTS"].outcome === "YES" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Yes</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["BTTS"].outcome === "YES" 
                            ? (prediction.predictions["BTTS"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["BTTS"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["BTTS"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["BTTS"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["BTTS"].outcome === "NO" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">No</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["BTTS"].outcome === "NO" 
                            ? (prediction.predictions["BTTS"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["BTTS"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["BTTS"].noOdds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["BTTS"].noOdds.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["Over_Under"] && (
                <AccordionItem value="overunder" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Over/Under {prediction.predictions["Over_Under"].line}.5 Goals</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Over_Under"].outcome === "OVER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Over {prediction.predictions["Over_Under"].line}.5</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Over_Under"].outcome === "OVER" 
                            ? (prediction.predictions["Over_Under"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Over_Under"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["Over_Under"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["Over_Under"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Over_Under"].outcome === "UNDER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Under {prediction.predictions["Over_Under"].line}.5</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Over_Under"].outcome === "UNDER" 
                            ? (prediction.predictions["Over_Under"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Over_Under"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["Over_Under"].underOdds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["Over_Under"].underOdds.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["PredictedScore"] && (
                <AccordionItem value="correctscore" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Correct Score</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border p-2 rounded text-center bg-primary/10 border-primary">
                        <div className="font-medium">
                          {prediction.homeTeam} {prediction.predictions["PredictedScore"].home} - {prediction.predictions["PredictedScore"].away} {prediction.awayTeam}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(prediction.predictions["PredictedScore"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["PredictedScore"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["PredictedScore"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
};