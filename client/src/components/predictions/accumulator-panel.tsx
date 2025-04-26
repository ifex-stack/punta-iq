import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, CopyIcon, TrendingUp, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PredictionItem {
  id: string;
  match: string;
  league: string;
  prediction: string;
  odds: number;
  confidence: number;
  sport: string;
  time: string;
}

interface AccumulatorData {
  id: string;
  predictions: PredictionItem[];
  totalOdds: number;
  name: string;
  confidenceScore: number;
  potentialReturn: number;
  isLocked?: boolean;
}

interface AccumulatorPanelProps {
  className?: string;
}

const AccumulatorPanel: React.FC<AccumulatorPanelProps> = ({ className }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("15");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Sample accumulators with different odds targets
  const accumulators: Record<string, AccumulatorData[]> = {
    "15": [
      {
        id: "acc-15-1",
        name: "Weekend Multi",
        predictions: [
          {
            id: "pred-1",
            match: "Arsenal vs Chelsea",
            league: "Premier League",
            prediction: "Over 2.5 Goals",
            odds: 1.85,
            confidence: 89,
            sport: "football",
            time: "Today, 15:00"
          },
          {
            id: "pred-2",
            match: "Barcelona vs Real Madrid",
            league: "La Liga",
            prediction: "BTTS",
            odds: 1.72,
            confidence: 92,
            sport: "football",
            time: "Tomorrow, 20:00"
          },
          {
            id: "pred-3",
            match: "Lakers vs Bulls",
            league: "NBA",
            prediction: "Lakers -5.5",
            odds: 1.95,
            confidence: 85,
            sport: "basketball",
            time: "Today, 23:30"
          },
          {
            id: "pred-4",
            match: "PSG vs Lyon",
            league: "Ligue 1",
            prediction: "PSG Win",
            odds: 1.55,
            confidence: 90,
            sport: "football",
            time: "Saturday, 17:00"
          },
        ],
        totalOdds: 9.68,
        confidenceScore: 87,
        potentialReturn: 193.60
      },
      {
        id: "acc-15-2",
        name: "Midweek Special",
        predictions: [
          {
            id: "pred-5",
            match: "Man United vs Liverpool",
            league: "Premier League",
            prediction: "BTTS & Over 2.5",
            odds: 1.95,
            confidence: 84,
            sport: "football",
            time: "Wednesday, 20:00"
          },
          {
            id: "pred-6",
            match: "Bayern vs Dortmund",
            league: "Bundesliga",
            prediction: "Bayern Win",
            odds: 1.65,
            confidence: 88,
            sport: "football",
            time: "Tuesday, 19:30"
          },
          {
            id: "pred-7",
            match: "Celtics vs Warriors",
            league: "NBA",
            prediction: "Over 220.5 Points",
            odds: 1.90,
            confidence: 81,
            sport: "basketball",
            time: "Thursday, 01:00"
          },
          {
            id: "pred-8",
            match: "Ajax vs PSV",
            league: "Eredivisie",
            prediction: "Over 2.5 Goals",
            odds: 1.75,
            confidence: 86,
            sport: "football",
            time: "Wednesday, 18:45"
          },
        ],
        totalOdds: 10.71,
        confidenceScore: 83,
        potentialReturn: 214.20
      }
    ],
    "20": [
      {
        id: "acc-20-1",
        name: "Weekend High Roller",
        predictions: [
          {
            id: "pred-9",
            match: "Man City vs Tottenham",
            league: "Premier League",
            prediction: "Man City -1.5",
            odds: 2.10,
            confidence: 82,
            sport: "football",
            time: "Saturday, 15:00"
          },
          {
            id: "pred-10",
            match: "Juventus vs Inter",
            league: "Serie A",
            prediction: "Under 2.5 Goals",
            odds: 1.85,
            confidence: 78,
            sport: "football",
            time: "Sunday, 20:45"
          },
          {
            id: "pred-11",
            match: "Bucks vs 76ers",
            league: "NBA",
            prediction: "Bucks -4.5",
            odds: 1.95,
            confidence: 80,
            sport: "basketball",
            time: "Saturday, 01:30"
          },
          {
            id: "pred-12",
            match: "Atletico vs Sevilla",
            league: "La Liga",
            prediction: "Atletico Win to Nil",
            odds: 2.60,
            confidence: 75,
            sport: "football",
            time: "Sunday, 16:15"
          },
        ],
        totalOdds: 19.82,
        confidenceScore: 78,
        potentialReturn: 396.40
      },
      {
        id: "acc-20-2",
        name: "Mixed Sports Value",
        isLocked: !user || !user.subscriptionTier || user.subscriptionTier === "Basic",
        predictions: [
          {
            id: "pred-13",
            match: "Liverpool vs Arsenal",
            league: "Premier League",
            prediction: "Both Teams to Score",
            odds: 1.75,
            confidence: 85,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-14",
            match: "Nadal vs Djokovic",
            league: "ATP",
            prediction: "Nadal to Win",
            odds: 2.30,
            confidence: 77,
            sport: "tennis",
            time: "Coming soon"
          },
          {
            id: "pred-15",
            match: "Suns vs Mavericks",
            league: "NBA",
            prediction: "Suns -3.5",
            odds: 1.90,
            confidence: 79,
            sport: "basketball",
            time: "Coming soon"
          },
          {
            id: "pred-16",
            match: "Rangers vs Celtic",
            league: "Scottish Premiership",
            prediction: "Over 2.5 Goals",
            odds: 1.85,
            confidence: 81,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-17",
            match: "Yankees vs Red Sox",
            league: "MLB",
            prediction: "Yankees to Win",
            odds: 1.70,
            confidence: 83,
            sport: "baseball",
            time: "Coming soon"
          },
        ],
        totalOdds: 20.31,
        confidenceScore: 81,
        potentialReturn: 406.20
      }
    ],
    "30": [
      {
        id: "acc-30-1",
        name: "Major Leagues Mega Acca",
        isLocked: !user || !user.subscriptionTier || user.subscriptionTier === "Basic",
        predictions: [
          {
            id: "pred-18",
            match: "Chelsea vs Man City",
            league: "Premier League",
            prediction: "BTTS & Over 2.5",
            odds: 2.10,
            confidence: 79,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-19",
            match: "Barcelona vs Atletico",
            league: "La Liga",
            prediction: "Barcelona Win",
            odds: 1.85,
            confidence: 80,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-20",
            match: "Bayern vs Leipzig",
            league: "Bundesliga",
            prediction: "Over 3.5 Goals",
            odds: 2.25,
            confidence: 77,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-21",
            match: "PSG vs Marseille",
            league: "Ligue 1",
            prediction: "PSG -1.5",
            odds: 1.95,
            confidence: 82,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-22",
            match: "Inter vs Milan",
            league: "Serie A",
            prediction: "Inter Win or Draw",
            odds: 1.40,
            confidence: 85,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-23",
            match: "Benfica vs Porto",
            league: "Primeira Liga",
            prediction: "Under 2.5 Goals",
            odds: 1.80,
            confidence: 78,
            sport: "football",
            time: "Coming soon"
          },
        ],
        totalOdds: 29.83,
        confidenceScore: 80,
        potentialReturn: 596.60
      }
    ],
    "50": [
      {
        id: "acc-50-1",
        name: "Ultimate Value Accumulator",
        isLocked: !user || !user.subscriptionTier !== "Elite",
        predictions: [
          {
            id: "pred-24",
            match: "Real Madrid vs Barcelona",
            league: "La Liga",
            prediction: "Real Madrid Win",
            odds: 2.10,
            confidence: 76,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-25",
            match: "Liverpool vs Man City",
            league: "Premier League",
            prediction: "BTTS & Over 2.5",
            odds: 1.95,
            confidence: 82,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-26",
            match: "Medvedev vs Zverev",
            league: "ATP",
            prediction: "Medvedev to Win",
            odds: 2.20,
            confidence: 75,
            sport: "tennis",
            time: "Coming soon"
          },
          {
            id: "pred-27",
            match: "Lakers vs Nets",
            league: "NBA",
            prediction: "Lakers Win",
            odds: 1.85,
            confidence: 78,
            sport: "basketball",
            time: "Coming soon"
          },
          {
            id: "pred-28",
            match: "Bayern vs Dortmund",
            league: "Bundesliga",
            prediction: "Bayern -1.5",
            odds: 2.10,
            confidence: 80,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-29",
            match: "PSG vs Monaco",
            league: "Ligue 1",
            prediction: "Over 3.5 Goals",
            odds: 2.30,
            confidence: 76,
            sport: "football",
            time: "Coming soon"
          },
          {
            id: "pred-30",
            match: "Dodgers vs Yankees",
            league: "MLB",
            prediction: "Total Runs Over 8.5",
            odds: 1.75,
            confidence: 79,
            sport: "baseball",
            time: "Coming soon"
          },
        ],
        totalOdds: 50.12,
        confidenceScore: 78,
        potentialReturn: 1002.40
      }
    ]
  };
  
  const handleCopyClick = (id: string, stake: number = 20) => {
    // Simulate copying selections to clipboard
    const accumulator = Object.values(accumulators)
      .flat()
      .find(acc => acc.id === id);
      
    if (accumulator) {
      const selectionsText = accumulator.predictions
        .map(pred => `${pred.match} - ${pred.prediction} @ ${pred.odds}`)
        .join("\n");
        
      const fullText = `PuntaIQ ${accumulator.name} (${accumulator.totalOdds.toFixed(2)})\n\n${selectionsText}\n\nStake: $${stake}\nPotential Return: $${(stake * accumulator.totalOdds).toFixed(2)}`;
      
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedId(id);
        
        toast({
          title: "Copied to clipboard",
          description: "Accumulator selections copied successfully",
        });
        
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(err => {
        console.error("Failed to copy text: ", err);
        
        toast({
          title: "Copy failed",
          description: "Failed to copy selections to clipboard",
          variant: "destructive",
        });
      });
    }
  };
  
  const handleUpgradeClick = () => {
    toast({
      title: "Subscription Required",
      description: "Upgrade your subscription to access this accumulator",
    });
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              AI Accumulator Tips
            </CardTitle>
            <CardDescription>
              Auto-generated multi-bets with high confidence
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="px-4 pt-2">
          <TabsList className="grid grid-cols-4 mb-2 w-full">
            <TabsTrigger value="15">
              15x Odds
            </TabsTrigger>
            <TabsTrigger value="20">
              20x Odds
            </TabsTrigger>
            <TabsTrigger value="30">
              30x Odds
            </TabsTrigger>
            <TabsTrigger value="50">
              50x Odds
            </TabsTrigger>
          </TabsList>
        </div>
        
        {Object.entries(accumulators).map(([odds, accaList]) => (
          <TabsContent key={odds} value={odds} className="m-0">
            <ScrollArea className="h-[450px]">
              <div className="px-4 pb-4 space-y-4">
                {accaList.map((acca) => (
                  <Card key={acca.id} className={cn(
                    "overflow-hidden border shadow-sm transition-all duration-200",
                    acca.isLocked && "opacity-90"
                  )}>
                    <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
                      <div>
                        <CardTitle className="text-base mb-1 flex items-center">
                          {acca.name}
                          {acca.isLocked && (
                            <Lock className="h-4 w-4 ml-2 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 hover:bg-green-600 rounded-sm">
                            {acca.confidenceScore}% Confidence
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {acca.predictions.length} Selections
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{acca.totalOdds.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total Odds</div>
                      </div>
                    </CardHeader>
                    
                    {acca.isLocked ? (
                      <CardContent className="p-0">
                        <div className="p-4 pt-0">
                          <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <Lock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                              <h3 className="text-lg font-medium mb-1">Premium Accumulator</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Upgrade your subscription to access this high-value accumulator tip
                              </p>
                              <Button onClick={handleUpgradeClick}>
                                Upgrade Subscription
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2 mt-2">
                            {acca.predictions.map((prediction, index) => (
                              <div key={prediction.id}>
                                {index > 0 && <Separator className="my-2" />}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm">{prediction.match}</div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{prediction.league}</span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">{prediction.time}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">{prediction.prediction}</div>
                                    <div className="text-xs text-muted-foreground">@{prediction.odds}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2 items-center">
                          <div className="bg-muted/50 p-2 rounded-md text-center flex-1 w-full">
                            <div className="text-xs text-muted-foreground">$20 Returns</div>
                            <div className="font-bold">${acca.potentialReturn.toFixed(2)}</div>
                          </div>
                          <Button 
                            className="w-full sm:w-auto flex-1"
                            variant="outline"
                            onClick={() => handleCopyClick(acca.id)}
                          >
                            {copiedId === acca.id ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <CopyIcon className="mr-2 h-4 w-4" />
                                Copy Selections
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default AccumulatorPanel;