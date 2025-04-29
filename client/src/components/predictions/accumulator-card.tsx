import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  CalendarDays,
  Clock,
  Calculator,
  Trash2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Selection {
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
}

interface Accumulator {
  id: string;
  createdAt: string;
  size: number;
  totalOdds: number;
  confidence: number;
  isPremium: boolean;
  selections: Selection[];
  type?: string;
}

interface AccumulatorCardProps {
  accumulator: Accumulator;
  userSubscription: string;
  onDelete: () => void;
  onPlaceBet: (stake: number) => void;
}

const AccumulatorCard: React.FC<AccumulatorCardProps> = ({
  accumulator,
  userSubscription,
  onDelete,
  onPlaceBet,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState(5);
  
  // Check if user has access to premium content
  const hasPremiumAccess = 
    userSubscription === "pro" || 
    userSubscription === "elite" || 
    !accumulator.isPremium;
  
  // Get accumulator size label
  const getSizeLabel = (size: number) => {
    if (size <= 2) return "Double";
    if (size === 3) return "Treble";
    if (size === 4) return "4-Fold";
    if (size === 5) return "5-Fold";
    return `${size}-Fold Acca`;
  };
  
  // Calculate potential returns
  const calculateReturns = () => {
    return (stake * accumulator.totalOdds).toFixed(2);
  };
  
  // Get type badge class
  const getTypeBadgeClass = () => {
    switch (accumulator.type?.toLowerCase()) {
      case "small":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "medium":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "large":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "mega":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };
  
  // Format date for nearest match
  const getNearestMatchTime = () => {
    const dates = accumulator.selections.map(s => new Date(s.startTime));
    const nearestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    return format(nearestDate, "MMM d, HH:mm");
  };
  
  // Sport emoji map
  const getSportEmoji = (sport: string) => {
    switch (sport.toLowerCase()) {
      case "football":
        return "⚽";
      case "basketball":
        return "🏀";
      case "baseball":
        return "⚾";
      case "tennis":
        return "🎾";
      case "american_football":
        return "🏈";
      case "hockey":
        return "🏒";
      default:
        return "🏆";
    }
  };
  
  return (
    <Card className={`overflow-hidden relative ${accumulator.isPremium && !hasPremiumAccess ? 'opacity-90' : ''}`}>
      {/* Premium badge */}
      {accumulator.isPremium && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-xs font-bold">
            PREMIUM
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary" />
              {getSizeLabel(accumulator.size)} Accumulator
            </CardTitle>
            <div className="flex items-center mt-1 space-x-3">
              <div className="flex items-center text-muted-foreground text-sm">
                <Star className="h-4 w-4 mr-1 text-amber-500" />
                {accumulator.confidence}% Confidence
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <CalendarDays className="h-4 w-4 mr-1" />
                {getNearestMatchTime()}
              </div>
            </div>
          </div>
          
          {accumulator.type && (
            <Badge variant="outline" className={getTypeBadgeClass()}>
              {accumulator.type.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex justify-between mb-4">
          <div className="text-2xl font-bold">{accumulator.totalOdds.toFixed(2)}</div>
          <div className="space-x-1">
            {accumulator.selections.map((selection, i) => (
              <Badge key={i} variant="outline" className="bg-muted/10">
                {getSportEmoji(selection.sport)}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Premium overlay */}
        {accumulator.isPremium && !hasPremiumAccess && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/60 to-card flex flex-col items-center justify-end p-6 text-center z-20">
            <Lock className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-bold mb-1">Premium Accumulator</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade your subscription to access premium accumulators
            </p>
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/subscription'}
              className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black hover:from-amber-600 hover:to-yellow-400"
            >
              Upgrade Now
            </Button>
          </div>
        )}
        
        {hasPremiumAccess && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Input
                  type="number"
                  min={1}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full"
                  placeholder="Stake amount"
                />
              </div>
              
              <div className="bg-muted/10 px-3 py-2 rounded-md">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <Calculator className="h-3 w-3 mr-1" />
                  Potential returns
                </div>
                <div className="font-bold">£{calculateReturns()}</div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onPlaceBet(stake)}
              >
                Place Bet
              </Button>
            </div>
          </>
        )}
      </CardContent>
      
      {hasPremiumAccess && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className="border-t border-border p-2 flex justify-center cursor-pointer hover:bg-accent/30 transition-colors">
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Selections
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    View Selections
                  </>
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t border-border">
              {accumulator.selections.map((selection, index) => {
                const matchDate = new Date(selection.startTime);
                
                return (
                  <div 
                    key={index}
                    className={`p-3 ${index !== accumulator.selections.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{selection.league}</span>
                      <span className="text-xs flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(matchDate, "MMM d, HH:mm")}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center space-x-1">
                          <span>{getSportEmoji(selection.sport)}</span>
                          <span>{selection.homeTeam} v {selection.awayTeam}</span>
                        </div>
                        <div className="text-sm mt-1">
                          {selection.market}: <span className="font-medium">{selection.outcome}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="mb-1 text-xs">
                          {selection.odds.toFixed(2)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {selection.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
};

export default AccumulatorCard;