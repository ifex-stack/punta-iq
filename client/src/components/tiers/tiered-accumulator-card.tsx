import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Bookmark as BookmarkIcon,
  ArrowRightIcon, 
  ClockIcon, 
  StarIcon, 
  TrendingUpIcon,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers
} from "lucide-react";
import { FaFutbol } from "react-icons/fa";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge, TierLevel } from "./tier-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Accumulator } from "@/hooks/use-tiered-accumulators";
import { Badge as BadgeIcon } from "lucide-react";

interface TieredAccumulatorCardProps {
  accumulator: Accumulator;
  isAccessible?: boolean;
  onSave?: (id: string) => void;
  onPlace?: (id: string) => void;
  isSaved?: boolean;
}

export function TieredAccumulatorCard({
  accumulator,
  isAccessible = true,
  onSave,
  onPlace,
  isSaved = false
}: TieredAccumulatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  
  // Format accumulator size name based on number of selections
  const getSizeName = (size: number): string => {
    if (size <= 2) return 'Double';
    if (size === 3) return 'Treble';
    if (size === 4) return 'Four-fold';
    if (size === 5) return 'Five-fold';
    if (size === 6) return 'Six-fold';
    if (size === 7) return 'Seven-fold';
    if (size === 8) return 'Eight-fold';
    return `${size}-fold Acca`;
  };
  
  // Format the tier level from string
  const tierLevel = accumulator.tier as TierLevel;

  // Calculate potential returns with £10 stake
  const potentialReturns = 10 * accumulator.totalOdds;
  
  // Locked content overlay
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
        This {tierLevel} accumulator requires a Pro or Elite subscription
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
      "overflow-hidden relative",
      isExpanded ? "shadow-lg" : "shadow",
      !isAccessible ? "opacity-95" : ""
    )}>
      {/* Add locked overlay if accumulator isn't accessible */}
      {!isAccessible && <LockedOverlay />}
      
      <CardHeader className={cn(
        "px-4 py-3",
        tierLevel === "Tier 1" ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20" : 
        tierLevel === "Tier 2" ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20" : 
        tierLevel === "Tier 5" ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20" : 
        "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
      )}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-bold">
                {getSizeName(accumulator.size)} Accumulator
              </CardTitle>
              <TierBadge 
                tier={tierLevel} 
                showLock={accumulator.isPremium}
                isAccessible={isAccessible}
                size="sm"
              />
            </div>
            <CardDescription className="flex items-center">
              <ClockIcon className="h-3.5 w-3.5 mr-1" />
              <span>Created {format(new Date(accumulator.createdAt), "dd MMM yyyy")}</span>
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
                      onSave?.(accumulator.id);
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
                  {isSaved ? "Remove from saved" : "Save accumulator"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pt-2 pb-3">
        <div className="flex flex-wrap gap-3 mb-3 justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Total Odds</span>
            <span className="text-2xl font-bold">{accumulator.totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Confidence</span>
            <span className="text-2xl font-bold">{accumulator.confidence}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">£10 Returns</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">£{potentialReturns.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Selection Preview (First two selections) */}
        {isAccessible && (
          <div className="space-y-2 mb-3">
            {accumulator.selections.slice(0, 2).map((selection, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between border rounded-md p-2 bg-muted/30"
              >
                <div className="pr-2">
                  <div className="font-medium text-sm truncate">
                    {selection.match.homeTeam} vs {selection.match.awayTeam}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground mr-2">
                      {format(new Date(selection.match.startTime), "dd MMM HH:mm")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {selection.match.league}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="secondary" className="mb-1">
                    {selection.prediction}
                  </Badge>
                  <span className="text-sm font-bold">{selection.odds.toFixed(2)}</span>
                </div>
              </div>
            ))}
            
            {/* Show indicator for more selections if needed */}
            {accumulator.selections.length > 2 && !isExpanded && (
              <div className="flex justify-center items-center text-xs text-muted-foreground py-1">
                +{accumulator.selections.length - 2} more selections
              </div>
            )}
          </div>
        )}
        
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs mt-1"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!isAccessible}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
              View all selections
            </>
          )}
        </Button>
        
        {/* Expanded Content */}
        {isExpanded && isAccessible && (
          <div className="mt-3">
            <h4 className="font-medium mb-2 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
              All Selections
            </h4>
            <div className="space-y-2.5">
              {accumulator.selections.map((selection, i) => (
                <div
                  key={i}
                  className="border rounded-md p-2.5 bg-muted/20"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="font-medium">
                      {selection.match.homeTeam} vs {selection.match.awayTeam}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {selection.match.league}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(selection.match.startTime), "dd MMM HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <StarIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        <span>{selection.confidence}%</span>
                      </div>
                      <Badge>{selection.prediction}</Badge>
                      <span className="font-bold">{selection.odds.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {isAccessible && (
        <CardFooter className="px-4 py-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 mr-2"
            onClick={() => {
              navigator.clipboard.writeText(
                `My ${getSizeName(accumulator.size)} Accumulator:\n` +
                accumulator.selections.map(s => 
                  `- ${s.match.homeTeam} vs ${s.match.awayTeam}: ${s.prediction} @ ${s.odds.toFixed(2)}`
                ).join('\n') +
                `\nTotal Odds: ${accumulator.totalOdds.toFixed(2)}\nPotential £10 Returns: £${potentialReturns.toFixed(2)}`
              );
              toast({
                title: "Copied to clipboard",
                description: "You can now share this accumulator",
              });
            }}
          >
            Share
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onPlace?.(accumulator.id)}
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            Place Bet
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}