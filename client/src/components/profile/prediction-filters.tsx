import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Save, 
  Football, 
  Basketball, 
  TennisBall,
  Goal,
  TimerReset,
  RefreshCw,
  BarChart4,
  DollarSign
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";

// Default prediction filters
const defaultPredictionFilters = {
  enabledSports: {
    football: true,
    basketball: true,
    tennis: false,
    baseball: false,
    hockey: false,
    cricket: false,
    formula1: false,
    mma: false,
    volleyball: false
  },
  enabledLeagues: {
    football: ["premier_league", "laliga", "bundesliga", "seriea", "ligue1", "champions_league"],
    basketball: ["nba", "euroleague"],
    tennis: [],
    baseball: [],
    hockey: [],
    cricket: [],
    formula1: [],
    mma: [],
    volleyball: []
  },
  marketTypes: {
    matchWinner: true,
    bothTeamsToScore: true,
    overUnder: true,
    correctScore: false,
    handicap: false,
    playerProps: false
  },
  minimumConfidence: 60,
  minimumOdds: 1.5,
  maximumOdds: 10.0,
  includeAccumulators: true
};

// Sport icons mapping
const SportIcon = ({ sport }: { sport: string }) => {
  switch (sport) {
    case 'football':
      return <Football className="h-4 w-4" />;
    case 'basketball':
      return <Basketball className="h-4 w-4" />;
    case 'tennis':
      return <TennisBall className="h-4 w-4" />;
    default:
      return <Goal className="h-4 w-4" />;
  }
};

// Sport display names
const sportDisplayNames: Record<string, string> = {
  football: "Football (Soccer)",
  basketball: "Basketball",
  tennis: "Tennis",
  baseball: "Baseball",
  hockey: "Hockey",
  cricket: "Cricket",
  formula1: "Formula 1",
  mma: "MMA",
  volleyball: "Volleyball"
};

// Market display names
const marketDisplayNames: Record<string, string> = {
  matchWinner: "Match Winner (1X2)",
  bothTeamsToScore: "Both Teams to Score",
  overUnder: "Over/Under Goals",
  correctScore: "Correct Score",
  handicap: "Handicap",
  playerProps: "Player Props"
};

// League display names
const leagueDisplayNames: Record<string, Record<string, string>> = {
  football: {
    premier_league: "Premier League (England)",
    laliga: "La Liga (Spain)",
    bundesliga: "Bundesliga (Germany)",
    seriea: "Serie A (Italy)",
    ligue1: "Ligue 1 (France)",
    champions_league: "Champions League",
    europa_league: "Europa League",
    world_cup: "World Cup",
    euro: "European Championship",
    copa_america: "Copa America"
  },
  basketball: {
    nba: "NBA (USA)",
    euroleague: "Euroleague",
    acb: "ACB (Spain)",
    nbl: "NBL (Australia)",
    ncaa: "NCAA (College)"
  }
};

export function PredictionFilters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState(defaultPredictionFilters);
  const [activeTab, setActiveTab] = useState("sports");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch existing prediction filters
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/user/prediction-filters"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    onSuccess: (data) => {
      if (data) {
        setFilters(data);
      }
    },
    onError: () => {
      // Keep using local filters
    }
  });

  // Mutation to update prediction filters
  const updateMutation = useMutation({
    mutationFn: async (newFilters: any) => {
      const response = await apiRequest("POST", "/api/user/prediction-filters", newFilters);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/prediction-filters"] });
      setHasChanges(false);
      toast({
        title: "Filters saved",
        description: "Your prediction filters have been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save filters",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Update local filters when data changes
  useEffect(() => {
    if (data) {
      setFilters(data);
    }
  }, [data]);

  // Handle sport toggle
  const handleSportToggle = (sport: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      enabledSports: {
        ...prev.enabledSports,
        [sport]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle market toggle
  const handleMarketToggle = (market: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      marketTypes: {
        ...prev.marketTypes,
        [market]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle confidence slider change
  const handleConfidenceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      minimumConfidence: value[0]
    }));
    setHasChanges(true);
  };

  // Handle odds sliders change
  const handleMinOddsChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      minimumOdds: value[0]
    }));
    setHasChanges(true);
  };

  const handleMaxOddsChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      maximumOdds: value[0]
    }));
    setHasChanges(true);
  };

  // Handle accumulator toggle
  const handleAccumulatorToggle = (value: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeAccumulators: value
    }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(filters);
  };

  // Handle reset to defaults
  const handleReset = () => {
    setFilters(defaultPredictionFilters);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prediction Filters</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={updateMutation.isPending}
            className="flex gap-2 items-center"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateMutation.isPending}
            className="flex gap-2 items-center"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-yellow-500" />
          <p>Prediction filters let you customize which types of predictions you receive.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="sports" className="flex gap-2 items-center">
            <Football className="h-4 w-4" />
            Sports & Leagues
          </TabsTrigger>
          <TabsTrigger value="markets" className="flex gap-2 items-center">
            <BarChart4 className="h-4 w-4" />
            Market Types
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex gap-2 items-center">
            <DollarSign className="h-4 w-4" />
            Odds & Confidence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-blue-500" />
                Sports & Leagues
              </CardTitle>
              <CardDescription>Select which sports and leagues you want predictions for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={["football", "basketball"]}>
                {Object.keys(sportDisplayNames).map(sport => (
                  <AccordionItem value={sport} key={sport}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <SportIcon sport={sport} />
                        <span className="font-medium">{sportDisplayNames[sport]}</span>
                      </div>
                      <Switch 
                        checked={filters.enabledSports[sport] || false} 
                        onCheckedChange={(checked) => handleSportToggle(sport, checked)}
                      />
                    </div>
                    <AccordionContent>
                      {filters.enabledSports[sport] && (
                        <div className="pl-8 pt-2 pb-1">
                          <p className="text-sm text-muted-foreground mb-2">Leagues ({leagueDisplayNames[sport] ? Object.keys(leagueDisplayNames[sport]).length : 0})</p>
                          <div className="flex flex-wrap gap-2">
                            {leagueDisplayNames[sport] && Object.entries(leagueDisplayNames[sport]).map(([leagueId, leagueName]) => (
                              <Badge key={leagueId} variant="outline" className="px-3 py-1">
                                {leagueName}
                              </Badge>
                            ))}
                            {!leagueDisplayNames[sport] && (
                              <span className="text-sm text-muted-foreground">No leagues configured</span>
                            )}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart4 className="h-5 w-5 text-purple-500" />
                Market Types
              </CardTitle>
              <CardDescription>Select which betting markets you want predictions for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(marketDisplayNames).map(([marketKey, marketName]) => (
                  <div key={marketKey} className="flex items-center justify-between py-1 border-b last:border-b-0">
                    <Label htmlFor={`market-${marketKey}`} className="cursor-pointer flex-grow">
                      {marketName}
                    </Label>
                    <Switch 
                      id={`market-${marketKey}`}
                      checked={filters.marketTypes[marketKey] || false} 
                      onCheckedChange={(checked) => handleMarketToggle(marketKey, checked)}
                    />
                  </div>
                ))}

                <div className="pt-4">
                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="accumulator-toggle" className="cursor-pointer flex-grow">
                      Include Accumulator (Parlay) Predictions
                    </Label>
                    <Switch 
                      id="accumulator-toggle"
                      checked={filters.includeAccumulators} 
                      onCheckedChange={handleAccumulatorToggle}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Odds & Confidence
              </CardTitle>
              <CardDescription>Set minimum requirements for predictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between items-center">
                  <Label>Minimum Confidence Level</Label>
                  <Badge variant="outline">{filters.minimumConfidence}%</Badge>
                </div>
                <Slider 
                  value={[filters.minimumConfidence]} 
                  min={40} 
                  max={90} 
                  step={5}
                  onValueChange={handleConfidenceChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>More Predictions</span>
                  <span>Higher Accuracy</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between items-center">
                  <Label>Minimum Odds</Label>
                  <Badge variant="outline">{filters.minimumOdds.toFixed(2)}</Badge>
                </div>
                <Slider 
                  value={[filters.minimumOdds]} 
                  min={1.1} 
                  max={3.0} 
                  step={0.1}
                  onValueChange={handleMinOddsChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Safer Bets</span>
                  <span>Higher Risk</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between items-center">
                  <Label>Maximum Odds</Label>
                  <Badge variant="outline">{filters.maximumOdds.toFixed(2)}</Badge>
                </div>
                <Slider 
                  value={[filters.maximumOdds]} 
                  min={3.0} 
                  max={20.0} 
                  step={0.5}
                  onValueChange={handleMaxOddsChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Lower Risk</span>
                  <span>Higher Payouts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}