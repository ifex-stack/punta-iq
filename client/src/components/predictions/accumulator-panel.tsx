import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Percent, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Accumulator {
  id: string;
  size: number;
  confidence: number;
  totalOdds: number;
  picks: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    confidence: number;
    odds: number;
  }>;
}

interface AccumulatorPanelProps {
  className?: string;
}

export function AccumulatorPanel({ className }: AccumulatorPanelProps) {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("today");
  
  const { data: accumulators, isLoading } = useQuery<Record<string, Accumulator>>({
    queryKey: ['/api/accumulators'],
    enabled: !!user,
  });
  
  const handleViewAccumulator = (size: string) => {
    navigate(`/accumulators/${size}`);
  };
  
  // Helper to format odds with 2 decimal places
  const formatOdds = (odds: number) => {
    return odds.toFixed(2);
  };
  
  // Show different content based on authentication status
  if (!user) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Accumulators</h3>
            <Badge className="bg-primary/10 text-primary border-primary/20">Pro Feature</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <p className="text-muted-foreground text-sm mb-4">
            Our AI system creates optimized accumulator bets with the highest probability of success.
          </p>
          <Button 
            variant="default" 
            className="w-full" 
            onClick={() => navigate("/auth")}
          >
            Sign in to View Accumulators
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold">Today's Accumulators</h3>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-md animate-pulse w-full" />
            <div className="h-24 bg-muted rounded-md animate-pulse w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No accumulators
  if (!accumulators || Object.keys(accumulators).length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold">Today's Accumulators</h3>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <p className="text-muted-foreground text-sm text-center py-6">
            No accumulators available for today.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Today's Accumulators</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-primary"
            onClick={() => navigate("/accumulators")}
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <Tabs
          defaultValue="double"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="double" className="flex-1">Double</TabsTrigger>
            <TabsTrigger value="treble" className="flex-1">Treble</TabsTrigger>
            <TabsTrigger value="quad" className="flex-1">Quad</TabsTrigger>
          </TabsList>
          
          {Object.entries(accumulators).map(([size, accumulator]) => (
            <TabsContent key={size} value={size} className="m-0">
              <div className="bg-muted/30 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1.5 text-primary" />
                    <span className="font-medium">{accumulator.size}-Fold Accumulator</span>
                  </div>
                  <Badge variant="outline" className="flex items-center">
                    <Percent className="h-3 w-3 mr-1" /> 
                    {accumulator.confidence}% confidence
                  </Badge>
                </div>
                <div className="text-sm font-medium mb-1">
                  Total Odds: {formatOdds(accumulator.totalOdds)}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {accumulator.picks.length} selections
                </div>
                
                <div className="space-y-2 mb-3">
                  {accumulator.picks.slice(0, 2).map((pick) => (
                    <div key={pick.id} className="bg-background rounded p-2 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium">{pick.homeTeam} vs {pick.awayTeam}</div>
                        <div>{formatOdds(pick.odds)}</div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-primary font-medium">{pick.prediction}</div>
                        <Badge 
                          variant="outline" 
                          className="text-xs h-5"
                        >
                          {pick.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {accumulator.picks.length > 2 && (
                    <div className="text-xs text-center text-muted-foreground">
                      + {accumulator.picks.length - 2} more selections
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                variant="default" 
                size="sm" 
                className="w-full"
                onClick={() => handleViewAccumulator(size)}
              >
                View Full {accumulator.size}-Fold Accumulator
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AccumulatorPanel;