import { useState } from "react";
import { format } from "date-fns";
import { 
  Bookmark, 
  BookmarkCheck, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check,
  Star,
  Lock,
  Calendar,
  Trophy,
  BarChart3,
  Zap,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import shared types
import { Prediction } from "@/lib/types";

interface EnhancedPredictionCardProps {
  prediction: Prediction;
  isPremium: boolean;
  userSubscription: string;
  isSaved: boolean;
  isInAccumulator: boolean;
  onSave: () => void;
  onAddToAccumulator: () => void;
}

const EnhancedPredictionCard: React.FC<EnhancedPredictionCardProps> = ({
  prediction,
  isPremium,
  userSubscription,
  isSaved,
  isInAccumulator,
  onSave,
  onAddToAccumulator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if user has access to premium content
  const hasPremiumAccess = 
    userSubscription === "pro" || 
    userSubscription === "elite" || 
    !isPremium;
  
  // Format date
  const matchDate = new Date(prediction.startTime);
  const formattedDate = format(matchDate, "MMM dd, yyyy");
  const formattedTime = format(matchDate, "HH:mm");
  
  // Determine match outcome color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (confidence >= 65) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };
  
  // Get sport icon
  const getSportIcon = (sport: string) => {
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
  
  // Get outcome details and styling
  const getOutcomeDetails = () => {
    const outcome = prediction.predictedOutcome;
    const confidenceClass = getConfidenceColor(prediction.confidence);

    // Convert outcome to display format
    let displayOutcome = outcome;
    if (outcome === 'H') {
      displayOutcome = 'Home Win';
    } else if (outcome === 'D') {
      displayOutcome = 'Draw';
    } else if (outcome === 'A') {
      displayOutcome = 'Away Win';
    }
    
    return (
      <Badge variant="outline" className={`${confidenceClass} px-2 py-1 text-sm font-medium`}>
        {displayOutcome} ({prediction.confidence}%)
      </Badge>
    );
  };
  
  return (
    <Card className={`overflow-hidden relative ${isPremium && !hasPremiumAccess ? 'opacity-90' : ''}`}>
      <CardContent className="p-0">
        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-xs font-bold">
              PREMIUM
            </Badge>
          </div>
        )}
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">{getSportIcon(prediction.sport)}</span>
              <span className="text-sm text-muted-foreground">{prediction.league}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <Calendar className="h-3 w-3 mr-1" />
                {formattedDate}
              </Badge>
            </div>
          </div>
          
          {/* Teams */}
          <div className="flex justify-between items-center my-3">
            <div className="flex-1 text-center">
              <h3 className="font-semibold">{prediction.homeTeam}</h3>
            </div>
            <div className="px-4 font-bold text-muted-foreground">vs</div>
            <div className="flex-1 text-center">
              <h3 className="font-semibold">{prediction.awayTeam}</h3>
            </div>
          </div>
          
          {/* Match time and prediction */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm font-medium">
              <Badge variant="outline" className="bg-muted/30 text-muted-foreground">
                {formattedTime}
              </Badge>
            </div>
            <div>
              {hasPremiumAccess ? (
                getOutcomeDetails()
              ) : (
                <Badge variant="outline" className="bg-primary/10 border-primary/30 px-2 py-1 text-sm font-medium">
                  <Lock className="h-3 w-3 mr-1" /> Premium Pick
                </Badge>
              )}
            </div>
          </div>
          
          {/* Value bet indicator */}
          {prediction.valueBet && hasPremiumAccess && (
            <div className="mt-3 bg-primary/5 border border-primary/10 rounded-md p-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Value Bet</span>
                </div>
                <div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {prediction.valueBet.outcome} @ {prediction.valueBet.odds.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {/* Premium content overlay */}
          {isPremium && !hasPremiumAccess && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/60 to-card flex flex-col items-center justify-end p-6 text-center z-20">
              <Lock className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-bold mb-1">Premium Content</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade your subscription to access premium predictions
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
        </div>
        
        {/* Detailed predictions */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className={`${!hasPremiumAccess ? 'pointer-events-none' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <div className="border-t border-border p-2 flex justify-center cursor-pointer hover:bg-accent/30 transition-colors">
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    View Details
                  </>
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-2 border-t border-border bg-muted/10">
              {/* AI Enhanced Badge */}
              {prediction.isAiEnhanced && (
                <div className="mb-3">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-2 py-1 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Enhanced
                  </Badge>
                  {prediction.modelUsed && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Model: {prediction.modelUsed}
                    </span>
                  )}
                </div>
              )}
              
              <h4 className="font-medium text-sm mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Predictions
              </h4>
              
              <div className="space-y-3">
                {prediction.predictions["1X2"] && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">1X2 Prediction</span>
                      <div className="flex space-x-2">
                        <Badge 
                          variant={prediction.predictions["1X2"].outcome === "H" ? "default" : "outline"} 
                          className="text-xs"
                        >
                          H: {(prediction.predictions["1X2"].homeWin.probability).toFixed(0)}%
                        </Badge>
                        <Badge 
                          variant={prediction.predictions["1X2"].outcome === "D" ? "default" : "outline"} 
                          className="text-xs"
                        >
                          D: {(prediction.predictions["1X2"].draw.probability).toFixed(0)}%
                        </Badge>
                        <Badge 
                          variant={prediction.predictions["1X2"].outcome === "A" ? "default" : "outline"} 
                          className="text-xs"
                        >
                          A: {(prediction.predictions["1X2"].awayWin.probability).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Market odds from bookmakers */}
                    <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Bookmaker Odds</span>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs bg-muted/30 hover:bg-muted/40">
                          H: {prediction.predictions["1X2"].homeWin.odds.toFixed(2)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-muted/30 hover:bg-muted/40">
                          D: {prediction.predictions["1X2"].draw.odds.toFixed(2)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-muted/30 hover:bg-muted/40">
                          A: {prediction.predictions["1X2"].awayWin.odds.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {prediction.predictions["BTTS"] && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Both Teams to Score</span>
                      <Badge 
                        variant={prediction.predictions["BTTS"].outcome === "Yes" ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        {prediction.predictions["BTTS"].outcome} ({prediction.predictions["BTTS"].probability.toFixed(0)}%)
                      </Badge>
                    </div>
                    
                    {prediction.predictions["BTTS"].odds && (
                      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground">Odds</span>
                        <Badge variant="outline" className="text-xs bg-muted/30">
                          {prediction.predictions["BTTS"].odds.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {prediction.predictions["Over_Under"] && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Over/Under {prediction.predictions["Over_Under"].line}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {prediction.predictions["Over_Under"].outcome} ({prediction.predictions["Over_Under"].probability.toFixed(0)}%)
                      </Badge>
                    </div>
                    
                    {prediction.predictions["Over_Under"].odds && (
                      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground">Odds</span>
                        <Badge variant="outline" className="text-xs bg-muted/30">
                          {prediction.predictions["Over_Under"].outcome}: {prediction.predictions["Over_Under"].odds.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {prediction.predictions["CorrectScore"] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Correct Score</span>
                    <Badge variant="outline" className="text-xs">
                      {prediction.predictions["CorrectScore"].outcome} ({prediction.predictions["CorrectScore"].probability.toFixed(0)}%)
                    </Badge>
                  </div>
                )}
                
                {prediction.predictions["PredictedScore"] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Predicted Score</span>
                    <Badge variant="secondary" className="text-xs">
                      {prediction.predictions["PredictedScore"].home} - {prediction.predictions["PredictedScore"].away}
                    </Badge>
                  </div>
                )}
                
                {prediction.predictions["Winner"] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Winner</span>
                    <Badge variant="outline" className="text-xs">
                      {prediction.predictions["Winner"].outcome} (
                      {prediction.predictions["Winner"].outcome === "Home" 
                        ? prediction.predictions["Winner"].homeWin.probability.toFixed(0)
                        : prediction.predictions["Winner"].awayWin.probability.toFixed(0)}%)
                    </Badge>
                  </div>
                )}
                
                {prediction.predictions["TotalPoints"] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Points {prediction.predictions["TotalPoints"].line}</span>
                    <Badge variant="outline" className="text-xs">
                      {prediction.predictions["TotalPoints"].outcome} ({prediction.predictions["TotalPoints"].probability.toFixed(0)}%)
                    </Badge>
                  </div>
                )}
                
                {prediction.predictions["Spread"] && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Spread {prediction.predictions["Spread"].line}</span>
                    <Badge variant="outline" className="text-xs">
                      {prediction.predictions["Spread"].favored} ({prediction.predictions["Spread"].probability.toFixed(0)}%)
                    </Badge>
                  </div>
                )}
                
                {/* Corners Over/Under */}
                {prediction.predictions["Corners_Over_Under"] && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Corners {prediction.predictions["Corners_Over_Under"].line}</span>
                      <Badge variant="outline" className="text-xs">
                        {prediction.predictions["Corners_Over_Under"].outcome} ({prediction.predictions["Corners_Over_Under"].probability.toFixed(0)}%)
                      </Badge>
                    </div>
                    
                    {prediction.predictions["Corners_Over_Under"].predictedCorners && (
                      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground">Predicted Corners</span>
                        <Badge variant="secondary" className="text-xs">
                          H: {prediction.predictions["Corners_Over_Under"].predictedCorners.home} | 
                          A: {prediction.predictions["Corners_Over_Under"].predictedCorners.away} | 
                          Total: {prediction.predictions["Corners_Over_Under"].predictedCorners.total}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cards Over/Under */}
                {prediction.predictions["Cards_Over_Under"] && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cards {prediction.predictions["Cards_Over_Under"].line}</span>
                      <Badge variant="outline" className="text-xs">
                        {prediction.predictions["Cards_Over_Under"].outcome} ({prediction.predictions["Cards_Over_Under"].probability.toFixed(0)}%)
                      </Badge>
                    </div>
                    
                    {prediction.predictions["Cards_Over_Under"].predictedCards && (
                      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground">Predicted Cards</span>
                        <Badge variant="secondary" className="text-xs">
                          H: {prediction.predictions["Cards_Over_Under"].predictedCards.home} | 
                          A: {prediction.predictions["Cards_Over_Under"].predictedCards.away} | 
                          Total: {prediction.predictions["Cards_Over_Under"].predictedCards.total}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* AI Analysis Section if available */}
                {prediction.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      AI Match Analysis
                    </h4>
                    
                    {/* Explanation */}
                    {prediction.aiAnalysis.explanation && (
                      <div className="bg-muted/20 p-3 rounded-md mb-3 text-sm">
                        {prediction.aiAnalysis.explanation}
                      </div>
                    )}
                    
                    {/* Team Analysis */}
                    {prediction.aiAnalysis.matchAnalysis && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-green-500/5 p-2 rounded-md">
                          <h5 className="text-xs font-medium mb-1 text-green-700">Home Strengths</h5>
                          <ul className="text-xs space-y-1">
                            {prediction.aiAnalysis.matchAnalysis.homeTeamStrengths.slice(0, 3).map((strength, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-green-500 mr-1">•</span> {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/5 p-2 rounded-md">
                          <h5 className="text-xs font-medium mb-1 text-red-700">Away Weaknesses</h5>
                          <ul className="text-xs space-y-1">
                            {prediction.aiAnalysis.matchAnalysis.awayTeamWeaknesses.slice(0, 3).map((weakness, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-red-500 mr-1">•</span> {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {/* Betting Advice */}
                    {prediction.aiAnalysis.bettingAdvice && prediction.aiAnalysis.bettingAdvice.valueBets && (
                      <div className="bg-blue-500/5 p-2 rounded-md">
                        <h5 className="text-xs font-medium mb-1 text-blue-700">Value Bets</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {prediction.aiAnalysis.bettingAdvice.valueBets.slice(0, 2).map((bet, i) => (
                            <Badge key={i} variant="outline" className="text-xs justify-start bg-blue-500/10 text-blue-700">
                              {bet.market}: {bet.selection} @ {bet.odds.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                        {prediction.aiAnalysis.bettingAdvice.stakeAdvice && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Stake advice: {prediction.aiAnalysis.bettingAdvice.stakeAdvice}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      
      {/* Card actions */}
      {hasPremiumAccess && (
        <CardFooter className="flex justify-between p-2 border-t border-border bg-card">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isSaved ? 'text-primary' : ''}`}
                  onClick={onSave}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaved ? 'Remove from saved' : 'Save prediction'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`h-8 w-8 ${isInAccumulator ? 'text-primary' : ''}`}
                  onClick={onAddToAccumulator}
                >
                  {isInAccumulator ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInAccumulator ? 'Remove from accumulator' : 'Add to accumulator'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
};

export default EnhancedPredictionCard;