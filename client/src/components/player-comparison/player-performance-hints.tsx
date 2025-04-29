import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerPerformanceHintsProps {
  playerId: number;
  includeMatchContext?: boolean;
  simplified?: boolean;
}

interface PerformanceHints {
  formSummary: string;
  strengths: string[];
  weaknesses: string[];
  fantasyOutlook: string;
  keyStats: string[];
  matchupInsight?: string;
  confidenceRating: number;
}

export function PlayerPerformanceHints({
  playerId,
  includeMatchContext = true,
  simplified = false,
}: PlayerPerformanceHintsProps) {
  const [expanded, setExpanded] = useState(!simplified);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/players", playerId, "performance-hints", { includeMatchContext }],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/performance-hints?includeMatchContext=${includeMatchContext}`);
      if (!res.ok) {
        throw new Error("Failed to fetch player performance hints");
      }
      return res.json();
    },
    // Stale for 1 hour (typically these won't change rapidly)
    staleTime: 1000 * 60 * 60,
  });
  
  // Helper function to get confidence color
  const getConfidenceColor = (rating: number) => {
    if (rating >= 8) return "text-green-500";
    if (rating >= 6) return "text-amber-500";
    if (rating >= 4) return "text-orange-500";
    return "text-red-500";
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error || !data) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Performance Hints Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We couldn't generate performance hints for this player at the moment.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const { performanceHints } = data;
  const hints: PerformanceHints = performanceHints?.hints || {
    formSummary: "No performance data available for this player.",
    strengths: [],
    weaknesses: [],
    fantasyOutlook: "Insufficient data to make a fantasy recommendation.",
    keyStats: [],
    confidenceRating: 0
  };
  
  // Simplified version (used in player comparison)
  if (simplified && !expanded) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span>Performance Insights</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm">{hints.formSummary}</p>
          
          <div className="flex items-center justify-between mt-3">
            <Badge 
              variant={hints.confidenceRating >= 7 ? "default" : "outline"} 
              className={cn(
                "flex items-center gap-1",
                hints.confidenceRating >= 7 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
              )}
            >
              <Target className="h-3 w-3" />
              Confidence: {hints.confidenceRating}/10
            </Badge>
            <span className="text-xs text-muted-foreground">
              {hints.strengths.length} strengths • {hints.weaknesses.length} concerns
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className={simplified ? "pb-2" : ""}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span>{simplified ? "Performance Insights" : "AI Performance Analysis"}</span>
          </div>
          
          {simplified && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        {!simplified && (
          <CardDescription>
            AI-powered analysis based on current form and statistics
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Current Form
          </h4>
          <p className="text-sm">{hints.formSummary}</p>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              Key Strengths
            </h4>
            {hints.strengths.length > 0 ? (
              <ul className="space-y-1">
                {hints.strengths.map((strength, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notable strengths identified</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              Areas of Concern
            </h4>
            {hints.weaknesses.length > 0 ? (
              <ul className="space-y-1">
                {hints.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No major concerns identified</p>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Fantasy Outlook
          </h4>
          <p className="text-sm">{hints.fantasyOutlook}</p>
        </div>
        
        {hints.matchupInsight && (
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-500" />
              Next Match Insight
            </h4>
            <p className="text-sm">{hints.matchupInsight}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            Key Stats
          </h4>
          <div className="flex flex-wrap gap-2">
            {hints.keyStats.map((stat, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {stat}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-0 pb-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Confidence Rating:</span>
                <span className={cn("text-sm font-bold", getConfidenceColor(hints.confidenceRating))}>
                  {hints.confidenceRating}/10
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                AI confidence in player performance based on available data
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4", 
                star <= Math.ceil(hints.confidenceRating / 2) 
                  ? "text-amber-400 fill-amber-400" 
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
      </CardFooter>
      
      {!simplified && (
        <div className="px-6 pb-4">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => window.location.href = `/fantasy/player-analysis?id=${playerId}`}
          >
            View Full Player Analysis
          </Button>
        </div>
      )}
    </Card>
  );
}