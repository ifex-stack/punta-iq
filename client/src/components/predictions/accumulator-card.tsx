import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Award, ChevronDown, ChevronUp, Clock, Sparkles, Star, Trophy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export interface AccumulatorCardProps {
  accumulator: {
    id: string;
    createdAt: string;
    size: number;
    totalOdds: number;
    confidence: number;
    isPremium: boolean;
    selections: Array<{
      matchId: string;
      homeTeam: string;
      awayTeam: string;
      league: string;
      startTime: string;
      sport: string;
      market: string;
      outcome: string;
      odds: number;
      confidence: number;
    }>;
    type?: string;
  };
  onDelete?: (accumulatorId: string) => void;
  onPlace?: (accumulatorId: string, stake: number) => void;
  subscriptionStatus?: "free" | "premium" | "none";
}

export default function AccumulatorCard({ 
  accumulator, 
  onDelete,
  onPlace,
  subscriptionStatus = "free" 
}: AccumulatorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [stake, setStake] = useState(5);
  const { toast } = useToast();
  
  const isAccumulatorLocked = accumulator.isPremium && subscriptionStatus !== "premium";
  
  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case "small":
        return "bg-blue-500";
      case "medium":
        return "bg-green-500";
      case "large":
        return "bg-purple-500";
      case "mega":
        return "bg-amber-500";
      default:
        return "bg-primary";
    }
  };
  
  const getTypeLabel = (type: string | undefined) => {
    switch (type) {
      case "small":
        return "Small Accumulator";
      case "medium":
        return "Medium Accumulator";
      case "large":
        return "Large Accumulator";
      case "mega":
        return "Mega Accumulator";
      default:
        return "Custom Accumulator";
    }
  };
  
  const getReturnValue = () => {
    return (stake * accumulator.totalOdds).toFixed(2);
  };
  
  const getStakeIncrement = () => {
    return Math.max(1, Math.min(5, Math.floor(stake / 10)));
  };
  
  const increaseStake = () => {
    setStake(prev => prev + getStakeIncrement());
  };
  
  const decreaseStake = () => {
    const increment = getStakeIncrement();
    setStake(prev => Math.max(1, prev - increment));
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(accumulator.id);
      
      toast({
        title: "Accumulator Deleted",
        description: "The accumulator has been removed from your list",
      });
    }
  };
  
  const handlePlace = () => {
    if (onPlace) {
      onPlace(accumulator.id, stake);
      
      toast({
        title: "Accumulator Placed",
        description: `Your £${stake} stake has been placed`,
      });
    }
  };
  
  const formatOutcome = (outcome: string, market: string) => {
    if (market === "1X2") {
      return outcome === "H" ? "Home Win" : outcome === "D" ? "Draw" : "Away Win";
    }
    if (market === "Winner") {
      return outcome === "H" ? "Home Win" : "Away Win";
    }
    if (market === "BTTS") {
      return outcome === "Yes" ? "Both Teams To Score: Yes" : "Both Teams To Score: No";
    }
    if (market === "Over_Under") {
      return `${outcome} 2.5 Goals`;
    }
    return outcome;
  };
  
  return (
    <Card className={cn(
      "w-full mb-4 overflow-hidden hover:shadow-md transition-shadow border-l-4",
      getTypeColor(accumulator.type)
    )}>
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal">
                {getTypeLabel(accumulator.type)}
              </Badge>
              <Badge 
                variant={accumulator.isPremium ? "premium" : "secondary"} 
                className={cn(
                  "text-xs font-medium",
                  accumulator.isPremium && "bg-gradient-to-r from-amber-400 to-yellow-600 text-white"
                )}
              >
                {accumulator.isPremium ? "PREMIUM" : "FREE"}
              </Badge>
              <Badge className="text-xs">
                {accumulator.size} Selections
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold flex items-center gap-1">
              <Trophy className="h-5 w-5 text-primary" />
              {accumulator.size}-Fold Accumulator
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Created {format(new Date(accumulator.createdAt), "dd MMM yyyy")}
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Odds</div>
            <div className="font-bold text-2xl bg-gradient-to-r bg-clip-text text-transparent from-amber-500 to-orange-600">
              {accumulator.totalOdds.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-3">
        <div className="space-y-3">
          {!isAccumulatorLocked && (
            <div className="flex items-center justify-between mt-2">
              <div className="text-muted-foreground text-sm">
                Confidence: <span className="font-medium">{accumulator.confidence}%</span>
              </div>
              <div className="flex gap-1 items-center">
                {Array.from({ length: Math.floor(accumulator.confidence / 20) }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - Math.floor(accumulator.confidence / 20) }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-muted" />
                ))}
              </div>
            </div>
          )}
          
          {isAccumulatorLocked ? (
            <div className="bg-muted/50 p-3 rounded-md flex flex-col items-center justify-center my-2 space-y-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-center font-medium">
                Premium accumulator locked. Upgrade to view details and place bets.
              </p>
              <Button variant="premium" size="sm" className="mt-1">
                Upgrade to Premium
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={decreaseStake}
                  >
                    -
                  </Button>
                  <div className="w-16 text-center font-bold">£{stake}</div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={increaseStake}
                  >
                    +
                  </Button>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Potential Returns</div>
                  <div className="font-bold">£{getReturnValue()}</div>
                </div>
              </div>
              
              <div className="pt-2 flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  size="sm"
                  onClick={handlePlace}
                >
                  <Award className="mr-1 h-4 w-4" />
                  Place Bet
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      {!isAccumulatorLocked && (
        <>
          <div 
            className="px-4 py-2 text-sm font-medium text-center cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide selections" : "View selections"}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {expanded && (
            <div className="divide-y">
              {accumulator.selections.map((selection, index) => (
                <div key={index} className="px-4 py-3 hover:bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline" className="text-xs">
                      {selection.league}
                    </Badge>
                    <Badge className="text-xs">
                      {selection.odds.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="font-medium mb-1">
                    {selection.homeTeam} vs {selection.awayTeam}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-muted-foreground">
                      {format(new Date(selection.startTime), "dd MMM, HH:mm")}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">
                        {selection.market}:
                      </div>
                      <Badge variant="secondary">
                        {formatOutcome(selection.outcome, selection.market)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}