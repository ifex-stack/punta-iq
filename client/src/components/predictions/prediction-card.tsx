import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bookmark, BookmarkPlus, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PredictionCardProps {
  prediction: {
    id: number;
    matchId: number;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    market: string;
    selection: string;
    odds: number;
    confidence: number;
    isPremium: boolean;
    reasoning: string;
  };
  compact?: boolean;
  className?: string;
}

export function PredictionCard({ prediction, compact = false, className }: PredictionCardProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(false);

  const {
    id,
    matchId,
    sport,
    league,
    homeTeam,
    awayTeam,
    startTime,
    market,
    selection,
    odds,
    confidence,
    isPremium,
    reasoning,
  } = prediction;
  
  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/user-predictions/toggle`, {
        userId: user?.id,
        predictionId: id,
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ['/api/user-predictions'] });
      toast({
        title: isSaved ? "Prediction removed" : "Prediction saved",
        description: isSaved 
          ? "Prediction has been removed from your saved list." 
          : "Prediction has been added to your saved list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleSave = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggleSaveMutation.mutate();
  };

  const handleViewDetails = () => {
    navigate(`/predictions/${id}`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-sm">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{sport}</span>
              <span className="text-sm font-medium">{league}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(startTime), "MMM d, h:mm a")}
            </div>
            {isPremium && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                PREMIUM
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <div className="font-semibold text-base">{homeTeam}</div>
            <div className="font-semibold text-base">{awayTeam}</div>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className={cn("px-3 py-2 rounded-md text-white font-medium", 
                getConfidenceColor(confidence)
              )}
            >
              <div className="text-center">{selection}</div>
              <div className="text-xs text-center">{confidence}% confidence</div>
            </div>
            <div className="text-sm font-medium mt-1.5">
              Odds: {odds.toFixed(2)}
            </div>
          </div>
        </div>
        
        {!compact && (
          <div className="text-sm text-muted-foreground mt-2 mb-3">
            <strong className="font-medium text-foreground">Analysis:</strong> {reasoning.length > 120 ? `${reasoning.substring(0, 120)}...` : reasoning}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 px-4 py-2.5 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggleSave}
          disabled={toggleSaveMutation.isPending}
        >
          {isSaved ? (
            <>
              <Bookmark className="h-4 w-4 mr-1.5" />
              Saved
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4 mr-1.5" />
              Save
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PredictionCard;