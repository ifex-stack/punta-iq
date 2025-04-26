import { useState } from "react";
import { format } from "date-fns";
import {
  BookmarkIcon,
  ChevronDown,
  ChevronUp,
  Lock,
  PlusSquare,
  TrendingUp,
  BarChart3,
  Clock,
  ChevronRight,
  DollarSign,
  Tag,
  Zap,
  Trophy,
  AlertTriangle,
  BarChart4,
} from "lucide-react";
import { FaFutbol } from "react-icons/fa";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomProgress } from "@/components/ui/custom-progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

export default function EnhancedPredictionCard({
  prediction,
  onSave,
  onAddToAccumulator,
  isSaved,
  isInAccumulator,
  subscriptionStatus = "free",
}: PredictionCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const isUserPremium = subscriptionStatus === "premium";
  const isLocked = prediction.isPremium && !isUserPremium;
  
  // Format date
  const matchDate = new Date(prediction.startTime);
  const formattedDate = format(matchDate, "MMM d, yyyy");
  const formattedTime = format(matchDate, "h:mm a");
  
  // Get main prediction market
  const mainMarket = prediction.predictions["1X2"] || prediction.predictions["Winner"];
  
  // Calculate confidence color based on prediction confidence
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
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
                <Badge variant={isUserPremium ? "secondary" : "premium"} className="ml-2">
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
      
      <CardContent className="px-4 pt-3 pb-0">
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
        
        {expanded && !isLocked && (
          <div className="mt-3 mb-1">
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
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["BTTS_Over"] && (
                <AccordionItem value="btts-over" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">BTTS & Over {prediction.predictions["BTTS_Over"].line}.5</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["BTTS_Over"].outcome === "YES" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Yes</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["BTTS_Over"].outcome === "YES" 
                            ? (prediction.predictions["BTTS_Over"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["BTTS_Over"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["BTTS_Over"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["BTTS_Over"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["BTTS_Over"].outcome === "NO" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">No</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["BTTS_Over"].outcome === "NO" 
                            ? (prediction.predictions["BTTS_Over"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["BTTS_Over"].probability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["Over_Under"] && (
                <AccordionItem value="over-under" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">
                        {prediction.sport === "football" ? "Goals" : "Points"} Over/Under {prediction.predictions["Over_Under"].line}.5
                      </span>
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
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["HalfTime_FullTime"] && (
                <AccordionItem value="ht-ft" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Half Time/Full Time</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {prediction.predictions["HalfTime_FullTime"].combinations?.map((combo, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border p-2 rounded text-center",
                            prediction.predictions["HalfTime_FullTime"]?.outcome === `${combo.halfTime}/${combo.fullTime}` 
                              ? "bg-primary/10 border-primary" 
                              : ""
                          )}
                        >
                          <div className="font-medium text-sm">{combo.halfTime}/{combo.fullTime}</div>
                          <div className="text-xs text-muted-foreground">
                            {(combo.probability * 100).toFixed(0)}%
                          </div>
                          {combo.odds && (
                            <div className="text-base font-bold">
                              {combo.odds.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground px-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Home (1), Draw (X), Away (2)
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["Double_Chance"] && (
                <AccordionItem value="double-chance" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Double Chance</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-3 gap-2">
                      {prediction.predictions["Double_Chance"].combinations.map((combo, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border p-2 rounded text-center",
                            prediction.predictions["Double_Chance"]?.outcome === combo.name 
                              ? "bg-primary/10 border-primary" 
                              : ""
                          )}
                        >
                          <div className="font-medium">{combo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(combo.probability * 100).toFixed(0)}%
                          </div>
                          {combo.odds && (
                            <div className="text-lg font-bold">
                              {combo.odds.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["CorrectScore"] && (
                <AccordionItem value="correct-score" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Correct Score</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-5 gap-1">
                      {prediction.predictions["CorrectScore"].scores?.slice(0, 10).map((score, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border p-1 rounded text-center",
                            prediction.predictions["CorrectScore"]?.outcome === `${score.home}-${score.away}` 
                              ? "bg-primary/10 border-primary" 
                              : ""
                          )}
                        >
                          <div className="font-medium">
                            {score.home}-{score.away}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((prediction.predictions["CorrectScore"]?.probability || 0) * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["Spread"] && (
                <AccordionItem value="spread" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Spread</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Spread"].favored === "HOME" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium truncate">
                          {prediction.homeTeam} {prediction.predictions["Spread"].line > 0 ? "+" : ""}{prediction.predictions["Spread"].line}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Spread"].favored === "HOME" 
                            ? (prediction.predictions["Spread"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Spread"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["Spread"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["Spread"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Spread"].favored === "AWAY" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium truncate">
                          {prediction.awayTeam} {prediction.predictions["Spread"].line > 0 ? "+" : ""}{prediction.predictions["Spread"].line * -1}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Spread"].favored === "AWAY" 
                            ? (prediction.predictions["Spread"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Spread"].probability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["TotalPoints"] && (
                <AccordionItem value="total-points" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Total Points</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["TotalPoints"].outcome === "OVER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Over {prediction.predictions["TotalPoints"].line}</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["TotalPoints"].outcome === "OVER" 
                            ? (prediction.predictions["TotalPoints"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["TotalPoints"].probability * 100).toFixed(0)}%
                        </div>
                        {prediction.predictions["TotalPoints"].odds && (
                          <div className="text-lg font-bold">
                            {prediction.predictions["TotalPoints"].odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["TotalPoints"].outcome === "UNDER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Under {prediction.predictions["TotalPoints"].line}</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["TotalPoints"].outcome === "UNDER" 
                            ? (prediction.predictions["TotalPoints"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["TotalPoints"].probability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 inline-block mr-1" />
                      Predicted Total: <span className="font-medium">{prediction.predictions["TotalPoints"].predictedTotal}</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {prediction.predictions["PredictedScore"] && (
                <AccordionItem value="predicted-score" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Predicted Score</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="flex justify-center py-2">
                      <div className="grid grid-cols-3 w-full max-w-xs">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Home</div>
                          <div className="text-2xl font-bold">{prediction.predictions["PredictedScore"].home}</div>
                          <div className="text-xs mt-1 truncate">{prediction.homeTeam}</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="text-xl font-bold">-</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Away</div>
                          <div className="text-2xl font-bold">{prediction.predictions["PredictedScore"].away}</div>
                          <div className="text-xs mt-1 truncate">{prediction.awayTeam}</div>
                        </div>
                      </div>
                    </div>
                    {prediction.predictions["PredictedScore"].probability && (
                      <div className="text-center text-sm text-muted-foreground">
                        Confidence: <span className="font-medium">{(prediction.predictions["PredictedScore"].probability * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between p-3 border-t">
        {isLocked ? (
          <Button variant="premium" className="w-full" disabled={!user}>
            <Lock className="h-4 w-4 mr-2" />
            {user ? "Upgrade to Premium" : "Login to Access"}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show More Details
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}