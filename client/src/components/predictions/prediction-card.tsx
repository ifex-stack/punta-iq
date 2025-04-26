import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LockIcon, 
  CheckCircleIcon, 
  PlusIcon,
  BoltIcon, 
  CheckIcon
} from "lucide-react";

interface PredictionCardProps {
  prediction: {
    id: number;
    matchId: number;
    predictedOutcome: string;
    confidence: number;
    isPremium: boolean;
    isLocked?: boolean;
    additionalPredictions: any;
  };
  match: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    homeOdds: number;
    drawOdds: number | null;
    awayOdds: number;
  };
  league: {
    id: number;
    name: string;
  } | null;
  isInAccumulator: boolean;
  onAddToAccumulator: (outcome: string, odds: number) => void;
}

const PredictionCard = ({ prediction, match, league, isInAccumulator, onAddToAccumulator }: PredictionCardProps) => {
  // Format match time
  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get prediction text
  const getPredictionText = () => {
    switch (prediction.predictedOutcome) {
      case "home":
        return "Home Win (1)";
      case "away":
        return "Away Win (2)";
      case "draw":
        return "Draw (X)";
      case "home_over2.5":
        return "Home Win & Over 2.5";
      default:
        return prediction.predictedOutcome;
    }
  };
  
  // Get odds for predicted outcome
  const getPredictionOdds = () => {
    switch (prediction.predictedOutcome) {
      case "home":
        return match.homeOdds;
      case "away":
        return match.awayOdds;
      case "draw":
        return match.drawOdds || 0;
      default:
        return match.homeOdds;
    }
  };
  
  return (
    <Card className="prediction-card overflow-hidden border border-border transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium py-1 text-xs">
                {league?.name || "Unknown League"}
              </Badge>
              <span className="ml-2 text-xs text-muted-foreground">
                Today, {formatMatchTime(match.startTime)}
              </span>
            </div>
            <h3 className="font-medium text-foreground">
              {match.homeTeam} vs {match.awayTeam}
            </h3>
          </div>
          <div>
            {prediction.isPremium ? (
              <Badge variant="outline" className="bg-accent/10 text-accent text-xs font-medium">
                <CrownIcon className="h-3 w-3 mr-1" /> Premium
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs font-medium">
                <CheckCircleIcon className="h-3 w-3 mr-1" /> Free
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between px-3 py-2 bg-background rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">1</div>
                <div className="text-lg font-bold text-foreground">{match.homeOdds.toFixed(2)}</div>
              </div>
              {match.drawOdds !== null && (
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">X</div>
                  <div className="text-lg font-bold text-foreground">{match.drawOdds.toFixed(2)}</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">2</div>
                <div className="text-lg font-bold text-foreground">{match.awayOdds.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              AI Prediction: {' '}
              <span className={prediction.isLocked ? "blur-sm text-muted-foreground" : "text-foreground"}>
                {getPredictionText()}
              </span>
            </span>
            <span className={`text-sm font-medium ${prediction.isLocked ? "blur-sm text-muted-foreground" : "text-foreground"}`}>
              {prediction.confidence}%
            </span>
          </div>
          <div className="h-2 rounded overflow-hidden bg-background">
            <div 
              className={`h-full ${prediction.isPremium ? 'bg-accent' : 'bg-primary'}`} 
              style={{ width: `${prediction.confidence}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${prediction.isLocked ? "blur-sm" : ""}`}>
            {prediction.additionalPredictions?.overUnder && (
              <Badge variant="outline" className="bg-background text-xs mr-2">
                <BoltIcon className="h-3 w-3 text-accent mr-1" /> 
                {prediction.additionalPredictions.overUnder}
              </Badge>
            )}
            {prediction.additionalPredictions?.btts && (
              <Badge variant="outline" className="bg-background text-xs">
                <CheckIcon className="h-3 w-3 text-green-500 mr-1" /> BTTS
              </Badge>
            )}
          </div>
          
          {prediction.isLocked ? (
            <Button size="sm" variant="outline" className="text-xs bg-card text-muted-foreground">
              <LockIcon className="h-3 w-3 mr-1" /> Locked
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant={isInAccumulator ? "default" : "outline"}
              className={`text-xs ${isInAccumulator ? 'bg-primary' : 'bg-primary/10 text-primary'}`}
              onClick={() => onAddToAccumulator(prediction.predictedOutcome, getPredictionOdds())}
            >
              {isInAccumulator ? 'In Accumulator' : 'Add to Acca'} <PlusIcon className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
        
        {/* Overlay for premium locked predictions */}
        {prediction.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
            <Button className="px-4 py-2 rounded-full bg-accent text-white">
              <LockIcon className="h-4 w-4 mr-2" /> Unlock Premium
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionCard;
