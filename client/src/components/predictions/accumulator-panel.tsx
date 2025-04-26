import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X as XIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface AccumulatorPanelProps {
  items: Array<{
    predictionId: number;
    match: {
      homeTeam: string;
      awayTeam: string;
    };
    outcome: string;
    odds: number;
  }>;
  totalOdds: string;
  confidence: number;
  onClearAll: () => void;
  onRemoveItem: (predictionId: number) => void;
}

const AccumulatorPanel = ({ 
  items, 
  totalOdds, 
  confidence, 
  onClearAll, 
  onRemoveItem 
}: AccumulatorPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get outcome display text
  const getOutcomeText = (outcome: string) => {
    switch (outcome) {
      case "home":
        return "Home Win (1)";
      case "away":
        return "Away Win (2)";
      case "draw":
        return "Draw (X)";
      case "home_over2.5":
        return "Home Win & Over 2.5";
      default:
        return outcome;
    }
  };

  // Check subscription tier limits
  const checkSubscriptionLimits = () => {
    if (!user) return false;

    switch (user.subscriptionTier) {
      case "free":
        return items.length <= 2; // Free users can only save 2-fold accas
      case "basic":
        return items.length <= 2; // Basic users can save 2-fold accas
      case "pro":
        return items.length <= 5; // Pro users can save up to 5-fold accas
      case "elite":
        return items.length <= 10; // Elite users can save up to 10-fold accas
      default:
        return items.length <= 2;
    }
  };

  // Save accumulator mutation
  const saveAccumulatorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/accumulator", {
        name: `Accumulator ${new Date().toLocaleDateString()}`,
        totalOdds: parseFloat(totalOdds),
        confidence,
        predictionIds: items.map(item => item.predictionId)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accumulators"] });
      toast({
        title: "Accumulator Saved",
        description: `Your ${items.length}-fold accumulator has been saved.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveAccumulator = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to save accumulators",
        variant: "destructive",
      });
      return;
    }

    if (!checkSubscriptionLimits()) {
      toast({
        title: "Subscription limit reached",
        description: `Your current plan only allows up to ${user.subscriptionTier === "pro" ? "5" : user.subscriptionTier === "elite" ? "10" : "2"}-fold accumulators`,
        variant: "destructive",
      });
      return;
    }

    saveAccumulatorMutation.mutate();
  };

  return (
    <Card className="bg-primary bg-opacity-10 border border-primary border-opacity-30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-bold text-foreground">Your Custom Accumulator</h3>
          <Button 
            variant="link" 
            className="text-xs text-primary p-0 h-auto"
            onClick={onClearAll}
          >
            Clear All
          </Button>
        </div>
        
        <div className="bg-card rounded-lg p-3 mb-3">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.predictionId} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {item.match.homeTeam} vs {item.match.awayTeam}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {getOutcomeText(item.outcome)}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => onRemoveItem(item.predictionId)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-sm text-muted-foreground">
              No selections added yet
            </div>
          )}
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-sm text-foreground">Total Odds</span>
          <span className="text-sm font-bold text-foreground">{totalOdds}</span>
        </div>
        
        <div className="flex justify-between mb-4">
          <span className="text-sm text-foreground">AI Confidence</span>
          <Badge className="bg-green-500/20 text-green-500 font-bold">
            {confidence}%
          </Badge>
        </div>
        
        <Button 
          className="w-full py-3 bg-primary text-white rounded-lg font-bold"
          onClick={handleSaveAccumulator}
          disabled={items.length === 0 || saveAccumulatorMutation.isPending}
        >
          {saveAccumulatorMutation.isPending ? "Saving..." : "Save Accumulator"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AccumulatorPanel;
