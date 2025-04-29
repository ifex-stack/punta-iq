import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity,
  AlertCircle,
  ArrowUpRight, 
  BookmarkIcon, 
  Clock,
  Filter, 
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap, 
  Trophy, 
  TrendingUp,
  CalendarDays,
  Info
} from 'lucide-react';

interface Prediction {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  prediction: string;
  confidence: number;
  odds: number;
  explanation: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  valueBet?: {
    market: string;
    selection: string;
    odds: number;
    value: number;
  };
}

type AccumulatorRisk = 'low' | 'medium' | 'high' | 'veryHigh' | 'extreme';

interface Accumulator {
  selections: Prediction[];
  totalOdds: string;
  potentialReturn: string;
  confidence: number;
}

export default function AccumulatorsPage() {
  // States
  const [activeAccumulator, setActiveAccumulator] = useState<AccumulatorRisk | null>(null);
  const [savedPredictions, setSavedPredictions] = useState<string[]>([]);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch football odds
  const { data: footballOdds, isLoading: isLoadingFootball, refetch: refetchFootball } = useQuery({
    queryKey: ['/api/odds/football'],
  });

  // Fetch basketball odds
  const { data: basketballOdds, isLoading: isLoadingBasketball, refetch: refetchBasketball } = useQuery({
    queryKey: ['/api/odds/basketball'],
  });

  // Merge all odds and process them
  const allPredictions: Prediction[] = React.useMemo(() => {
    const predictions: Prediction[] = [];
    
    if (footballOdds) {
      Object.values(footballOdds).forEach((prediction: any) => {
        predictions.push({
          ...prediction,
          odds: parseFloat(prediction.homeOdds) || 1.5,
          status: 'pending',
        });
      });
    }
    
    if (basketballOdds) {
      Object.values(basketballOdds).forEach((prediction: any) => {
        predictions.push({
          ...prediction,
          odds: parseFloat(prediction.homeOdds) || 1.5,
          status: 'pending',
        });
      });
    }
    
    return predictions;
  }, [footballOdds, basketballOdds]);
  
  const isLoading = isLoadingFootball || isLoadingBasketball;
  const hasPredictions = allPredictions && allPredictions.length > 0;

  // Generate accumulator predictions with different odds levels
  const generateAccumulator = (targetOdds: number) => {
    // Clone and shuffle predictions to get various combinations
    const shuffled = [...allPredictions]
      .filter(p => p.confidence > 60)
      .sort(() => 0.5 - Math.random());
      
    let currentOdds = 1;
    const selections: Prediction[] = [];
    
    // Add predictions until we reach or exceed target odds
    for (const prediction of shuffled) {
      if (selections.length >= 10) break; // Maximum 10 selections
      
      // Calculate new odds if we add this prediction
      const newOdds = currentOdds * (prediction.odds || 1.5);
      
      // If adding this would exceed target odds by too much, skip
      if (selections.length > 0 && newOdds > targetOdds * 1.5) continue;
      
      selections.push(prediction);
      currentOdds = newOdds;
      
      // Stop if we've reached target odds range
      if (currentOdds >= targetOdds * 0.8 && currentOdds <= targetOdds * 1.2) break;
    }
    
    return {
      selections,
      totalOdds: currentOdds.toFixed(2),
      potentialReturn: (100 * currentOdds).toFixed(2),
      confidence: Math.floor(selections.reduce((sum, p) => sum + p.confidence, 0) / Math.max(1, selections.length))
    };
  };
  
  // Generate accumulators with different odds targets
  const accumulators = React.useMemo(() => ({
    low: generateAccumulator(2),
    medium: generateAccumulator(5),
    high: generateAccumulator(10),
    veryHigh: generateAccumulator(20),
    extreme: generateAccumulator(50)
  }), [allPredictions]);

  // Refresh data
  const refreshData = async () => {
    await Promise.all([
      refetchFootball(),
      refetchBasketball(),
    ]);
    toast({
      title: "Data Refreshed",
      description: "Latest accumulator data has been loaded",
    });
  };

  // Toggle save prediction
  const handleSavePrediction = (predictionId: string) => {
    if (savedPredictions.includes(predictionId)) {
      setSavedPredictions(savedPredictions.filter(id => id !== predictionId));
      toast({
        title: "Prediction Removed",
        description: "Removed from your saved predictions",
      });
    } else {
      setSavedPredictions([...savedPredictions, predictionId]);
      toast({
        title: "Prediction Saved",
        description: "Added to your saved predictions",
      });
    }
  };

  // Get color styles for accumulator cards based on risk level
  const getAccumulatorStyles = (risk: AccumulatorRisk) => {
    switch (risk) {
      case 'low':
        return {
          badge: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
          bg: "p-2 bg-green-50 dark:bg-green-900/20 rounded-md",
          text: "text-green-800 dark:text-green-400"
        };
      case 'medium':
        return {
          badge: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
          bg: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md",
          text: "text-blue-800 dark:text-blue-400"
        };
      case 'high':
        return {
          badge: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
          bg: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md",
          text: "text-amber-800 dark:text-amber-400"
        };
      case 'veryHigh':
        return {
          badge: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
          bg: "p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md",
          text: "text-orange-800 dark:text-orange-400"
        };
      case 'extreme':
        return {
          badge: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
          bg: "p-2 bg-red-50 dark:bg-red-900/20 rounded-md",
          text: "text-red-800 dark:text-red-400"
        };
    }
  };

  // Get accumulator name from risk level
  const getAccumulatorName = (risk: AccumulatorRisk) => {
    switch (risk) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      case 'veryHigh': return 'Very High Risk';
      case 'extreme': return 'Extreme Risk';
    }
  };

  // Get icon based on accumulator risk level
  const getAccumulatorIcon = (risk: AccumulatorRisk) => {
    switch (risk) {
      case 'low': return <Zap className="h-5 w-5 mr-2 text-green-600" />;
      case 'medium': return <Activity className="h-5 w-5 mr-2 text-blue-600" />;
      case 'high': return <Trophy className="h-5 w-5 mr-2 text-amber-600" />;
      case 'veryHigh': return <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />;
      case 'extreme': return <AlertCircle className="h-5 w-5 mr-2 text-red-600" />;
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 max-w-7xl">
      {/* Header with gradient background */}
      <div className="relative rounded-lg overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-purple-700/90"></div>
        <div className="relative p-5 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                PuntaIQ Accumulators
              </h1>
              <p className="mt-1 text-blue-100 max-w-xl">
                AI-generated accumulator bets with various risk levels to maximize your returns
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={refreshData}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              <Button
                className="bg-white text-indigo-700 hover:bg-blue-100"
                onClick={() => setLocation('/predictions')}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Single Predictions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border/30">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* No predictions state */}
      {!isLoading && !hasPredictions && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Accumulators Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no predictions available to generate accumulators.
            </p>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Accumulators grid */}
      {!isLoading && hasPredictions && (
        <div className="space-y-8">
          {/* Today's Accumulators */}
          <div>
            <div className="flex items-center mb-4">
              <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
              <h2 className="text-xl font-bold">Today's Accumulators</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(accumulators).map(([risk, accumulator]) => {
                const styles = getAccumulatorStyles(risk as AccumulatorRisk);
                return (
                  <Card 
                    key={risk}
                    className={`border-indigo-200 dark:border-indigo-800/50 hover:shadow-md transition-shadow ${activeAccumulator === risk ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base font-medium flex items-center">
                        {getAccumulatorIcon(risk as AccumulatorRisk)}
                        {getAccumulatorName(risk as AccumulatorRisk)}
                      </CardTitle>
                      <CardDescription className="text-xs">Odds: {accumulator.totalOdds}x</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="secondary" className="font-medium">{accumulator.selections.length} Selections</Badge>
                          <Badge className={styles.badge}>{accumulator.confidence}% Confidence</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Stake: £100</p>
                        <div className={styles.bg}>
                          <p className={`text-center font-medium ${styles.text}`}>
                            Potential Return: £{accumulator.potentialReturn}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveAccumulator(activeAccumulator === risk as AccumulatorRisk ? null : risk as AccumulatorRisk)}
                      >
                        {activeAccumulator === risk ? 'Hide Selections' : 'View Selections'}
                        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${activeAccumulator === risk ? 'rotate-180' : ''}`} />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selections for active accumulator */}
          {activeAccumulator && (
            <Card className="border-indigo-200 dark:border-indigo-800/50 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  {getAccumulatorIcon(activeAccumulator)}
                  {getAccumulatorName(activeAccumulator)} Accumulator Selections
                </CardTitle>
                <CardDescription>
                  {accumulators[activeAccumulator].selections.length} selections with combined odds of {accumulators[activeAccumulator].totalOdds}x
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accumulators[activeAccumulator].selections.map((prediction, index) => (
                    <Card key={prediction.id} className="overflow-hidden border-0 shadow-sm">
                      <div className="p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-background/80">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">{prediction.homeTeam} vs {prediction.awayTeam}</span>
                              <Badge className="ml-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                Selection {index + 1}
                              </Badge>
                            </div>
                            <Badge 
                              variant={prediction.confidence >= 75 ? "default" : "outline"}
                              className={`md:hidden ${
                                prediction.confidence >= 75 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              }`}
                            >
                              {prediction.confidence}% Confidence
                            </Badge>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <span className="mr-3">{prediction.league}</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(prediction.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-2 md:mt-0 justify-between">
                          <Badge 
                            variant={prediction.confidence >= 75 ? "default" : "outline"}
                            className={`mr-3 hidden md:inline-flex ${
                              prediction.confidence >= 75 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {prediction.confidence}% Confidence
                          </Badge>
                          <div className="flex items-center">
                            <span className="font-medium text-primary mr-2">
                              {prediction.prediction} @ {prediction.odds?.toFixed(2) || '-'}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleSavePrediction(prediction.id)}>
                              <BookmarkIcon className={`h-5 w-5 ${savedPredictions.includes(prediction.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-muted/20">
                <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Projected outcome</span>
                    <div className="flex items-center">
                      <span className="font-medium">£100 stake</span>
                      <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-bold text-green-600">£{accumulators[activeAccumulator].potentialReturn} return</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveAccumulator(null)}>
                      Close Details
                    </Button>
                    <Button>
                      Save Accumulator
                      <BookmarkIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Suggested Accumulators */}
          <div>
            <div className="flex items-center mb-4">
              <Trophy className="h-5 w-5 mr-2 text-muted-foreground" />
              <h2 className="text-xl font-bold">PuntaIQ's Expert Accumulators</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="overflow-hidden border-indigo-200">
                <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30 pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-indigo-600" />
                    Weekly Banker
                  </CardTitle>
                  <CardDescription>Our most confident accumulator this week</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">4 Selections</Badge>
                      <Badge className="bg-green-100 text-green-800">85% Confidence</Badge>
                    </div>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-sm">£100 Stake</span>
                        <span className="font-medium text-indigo-700 dark:text-indigo-300">8.25x Odds</span>
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-lg font-bold text-green-600">£825 Potential Return</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">View Selections</Button>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-purple-200">
                <CardHeader className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Value Hunter
                  </CardTitle>
                  <CardDescription>Best value odds with highest potential return</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">6 Selections</Badge>
                      <Badge className="bg-amber-100 text-amber-800">72% Confidence</Badge>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-sm">£100 Stake</span>
                        <span className="font-medium text-purple-700 dark:text-purple-300">32.45x Odds</span>
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-lg font-bold text-green-600">£3,245 Potential Return</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">View Selections</Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Combination Accumulators */}
          <div>
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
              <h2 className="text-xl font-bold">Mixed Sport Accumulators</h2>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Cross-Sport Specials</CardTitle>
                <CardDescription>Combine football, basketball, and more sports in one accumulator</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="weekend-special">
                    <AccordionTrigger className="py-3">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20">Football + Basketball</Badge>
                        Weekend Special Accumulator
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span>5 Selections</span>
                        <span>15.37x Odds</span>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-center">
                        <span className="font-medium text-blue-800 dark:text-blue-300">£100 stake could return £1,537</span>
                      </div>
                      <Button size="sm" className="w-full mt-2">View Full Details</Button>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="global-sports">
                    <AccordionTrigger className="py-3">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 dark:bg-purple-900/20">Multi-Sport</Badge>
                        Global Sports Accumulator
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span>7 Selections</span>
                        <span>42.85x Odds</span>
                      </div>
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md text-center">
                        <span className="font-medium text-purple-800 dark:text-purple-300">£100 stake could return £4,285</span>
                      </div>
                      <Button size="sm" className="w-full mt-2">View Full Details</Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}