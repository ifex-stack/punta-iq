import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Bookmark as BookmarkIcon,
  PlusSquare,
  Trophy,
  Clock,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Info
} from "lucide-react";
import { FaFutbol } from "react-icons/fa";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import new tier components
import { TierBadge, TierLevel, getTierFromString } from "./tier-badge";
import { ConfidenceIndicator, getConfidenceLevel } from "./confidence-indicator";
import { ValueBetIndicator } from "./value-bet-indicator";
import { Prediction } from "@/hooks/use-tiered-predictions";

interface TieredPredictionCardProps {
  prediction: Prediction;
  isSaved?: boolean;
  isInAccumulator?: boolean;
  onSave?: (id: string) => void;
  onAddToAccumulator?: (id: string) => void;
  subscriptionStatus?: string;
  isAccessible?: boolean;
}

export function TieredPredictionCard({ 
  prediction, 
  isSaved = false,
  isInAccumulator = false,
  onSave,
  onAddToAccumulator,
  subscriptionStatus = "free",
  isAccessible = true
}: TieredPredictionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Get tier information
  const tierLevel = getTierFromString(prediction.tier);
  const confidenceLevel = getConfidenceLevel(prediction.confidence);
  
  // Determine if showing main market (1X2 for football or Winner for basketball)
  const mainMarket = true;

  // Parse the date for display
  const matchDate = new Date(prediction.startTime);
  const formattedDate = format(matchDate, "dd MMM yyyy");
  const formattedTime = format(matchDate, "HH:mm");
  
  // Determine sport icon
  const getSportIcon = () => {
    if (prediction.sport === "football") {
      return <FaFutbol className="h-4 w-4 text-muted-foreground" />;
    } else {
      return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Format personalized prediction description
  const getPredictionDescription = () => {
    if (prediction.sport === "football" && prediction.predictions["1X2"]) {
      const outcome = prediction.predictions["1X2"].outcome;
      const team = outcome === "HOME_WIN" ? prediction.homeTeam : outcome === "AWAY_WIN" ? prediction.awayTeam : "Draw";
      const action = outcome === "DRAW" ? "draw" : "win";
      
      // More personalized descriptions based on confidence
      if (prediction.confidence >= 85) {
        return `Strong chance for ${team} to ${action} this match`;
      } else if (prediction.confidence >= 70) {
        return `${team} looking likely to ${action} based on recent form`;
      } else {
        return `${team} may edge this one with a ${action}`;
      }
    } else if (prediction.sport === "basketball" && prediction.predictions["Winner"]) {
      const outcome = prediction.predictions["Winner"].outcome;
      const team = outcome === "HOME_WIN" ? prediction.homeTeam : prediction.awayTeam;
      
      // Personalized basketball descriptions
      if (prediction.confidence >= 85) {
        return `Expect a convincing win for ${team}`;
      } else if (prediction.confidence >= 70) {
        return `${team} should come out on top in this matchup`;
      } else {
        return `${team} has a slight edge in this contest`;
      }
    }
    return prediction.predictedOutcome;
  };

  // Overlay for locked content
  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 px-4">
      <TierBadge 
        tier={tierLevel} 
        showLock={true} 
        isAccessible={false} 
        size="lg" 
        className="mb-3"
      />
      <p className="text-center text-muted-foreground mb-3 max-w-[250px]">
        This {tierLevel} prediction requires a Pro or Elite subscription
      </p>
      <Button 
        variant="default"
        size="sm"
        onClick={() => window.location.href = "/subscription-page"}
      >
        Upgrade to Access
      </Button>
    </div>
  );

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 relative",
      expanded ? "shadow-lg" : "shadow",
      !isAccessible ? "opacity-95" : ""
    )}>
      {/* Add locked overlay if prediction isn't accessible */}
      {!isAccessible && <LockedOverlay />}
      
      <CardHeader className={cn(
        "px-4 py-3",
        tierLevel === "Tier 1" ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20" : 
        tierLevel === "Tier 2" ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20" : 
        tierLevel === "Tier 5" ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20" : 
        "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
      )}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {getSportIcon()}
              <span className="text-sm font-medium text-muted-foreground">
                {prediction.league}
              </span>
              <TierBadge 
                tier={tierLevel} 
                showLock={prediction.isPremium}
                isAccessible={isAccessible}
                size="sm"
                className="ml-1.5"
              />
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
                    disabled={!isAccessible}
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
                    disabled={!isAccessible}
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
        {/* Confidence Indicator */}
        <div className="mb-4">
          <ConfidenceIndicator 
            confidence={prediction.confidence}
            explanation={prediction.confidence_explanation}
            showExplanation={isAccessible}
            className="mb-3"
          />
          
          {/* Odds Display */}
          {isAccessible && mainMarket && (
            <div className="flex items-center justify-between border rounded-md p-2 bg-muted/30">
              <span className="text-sm text-muted-foreground">Best Odds</span>
              <span className="text-lg font-bold">
                {prediction.predictions["1X2"] ? 
                  (prediction.predictions["1X2"].outcome === "HOME_WIN" ? 
                    prediction.predictions["1X2"].homeWin.odds : 
                    prediction.predictions["1X2"].outcome === "AWAY_WIN" ? 
                      prediction.predictions["1X2"].awayWin.odds : 
                      prediction.predictions["1X2"].draw.odds).toFixed(2) : 
                  (prediction.predictions["Winner"]?.outcome === "HOME_WIN" ? 
                    prediction.predictions["Winner"].homeWin.odds : 
                    prediction.predictions["Winner"]?.awayWin.odds).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        {/* AI Prediction */}
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <Trophy className="h-4 w-4 mr-1.5 text-primary" />
            <h3 className="font-bold">AI Prediction</h3>
          </div>
          <div className="flex items-center justify-between mb-1 px-2 py-1.5 bg-muted/30 rounded-md">
            <div>
              <span className="font-medium">{isAccessible ? getPredictionDescription() : "Premium Prediction"}</span>
            </div>
          </div>
        </div>
        
        {/* Value Bet Indicator */}
        {isAccessible && prediction.valueBet && (
          <div className="mb-4">
            <ValueBetIndicator 
              valueBet={prediction.valueBet}
              showOdds={true}
              showOutcome={true}
            />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs" 
          onClick={() => setExpanded(!expanded)}
          disabled={!isAccessible}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
          {expanded ? "Show less" : "Show more markets"}
        </Button>
        
        {/* Expanded Markets Section */}
        {expanded && isAccessible && (
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
              
              {prediction.predictions["Over/Under"] && (
                <AccordionItem value="ou" className="border-b">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">Over/Under 2.5 Goals</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Over/Under"].outcome === "OVER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Over 2.5</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Over/Under"].outcome === "OVER" 
                            ? (prediction.predictions["Over/Under"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Over/Under"].probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">
                          {prediction.predictions["Over/Under"].overOdds.toFixed(2)}
                        </div>
                      </div>
                      <div className={cn(
                        "border p-2 rounded text-center",
                        prediction.predictions["Over/Under"].outcome === "UNDER" ? "bg-primary/10 border-primary" : ""
                      )}>
                        <div className="font-medium">Under 2.5</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.predictions["Over/Under"].outcome === "UNDER" 
                            ? (prediction.predictions["Over/Under"].probability * 100).toFixed(0) 
                            : (100 - prediction.predictions["Over/Under"].probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">
                          {prediction.predictions["Over/Under"].underOdds.toFixed(2)}
                        </div>
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
}