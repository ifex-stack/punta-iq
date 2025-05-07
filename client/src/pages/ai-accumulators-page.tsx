import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { ChevronRight, Sparkles, Brain, RefreshCw, Filter, Trophy, ArrowRight, Coins, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PredictionCard } from '@/components/mobile/prediction-card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Prediction type for AI-generated accumulators
interface Prediction {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  date: string;
  prediction: string;
  odds: number;
  confidence: number;
  analysis?: string;
}

// Accumulator type
interface Accumulator {
  id: number;
  name: string;
  predictions: Prediction[];
  totalOdds: number;
  confidenceScore: number;
  createdAt: string;
}

export default function AIAccumulatorsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('builder');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(['football', 'basketball']);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(75);
  const [maxSelections, setMaxSelections] = useState<number>(4);
  const [analysisDepth, setAnalysisDepth] = useState<string>('standard');
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [generatedAccumulator, setGeneratedAccumulator] = useState<Accumulator | null>(null);
  const [savedAccumulators, setSavedAccumulators] = useState<Accumulator[]>([]);

  // AI Status
  const [aiStatus, setAIStatus] = useState({
    enabled: true,
    status: 'connected',
    model: 'gpt-4o',
  });

  // Available sports
  const sports = [
    { id: 'football', name: 'Football', icon: '⚽️' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'hockey', name: 'Hockey', icon: '🏒' },
    { id: 'baseball', name: 'Baseball', icon: '⚾️' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  ];

  // Mock mutation for generating AI accumulators
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockPredictions: Prediction[] = [
        {
          id: 1,
          homeTeam: 'Manchester United',
          awayTeam: 'Chelsea',
          league: 'Premier League',
          sport: 'football',
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          prediction: 'Home Win',
          odds: 2.1,
          confidence: 78,
          analysis: 'Manchester United has won 4 of their last 5 home games and Chelsea has struggled in away fixtures recently.'
        },
        {
          id: 2,
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Brooklyn Nets',
          league: 'NBA',
          sport: 'basketball',
          date: new Date(Date.now() + 86400000 * 1).toISOString(),
          prediction: 'Over 220.5 Points',
          odds: 1.85,
          confidence: 82,
          analysis: 'Both teams are in the top 5 for offensive efficiency and have hit the over in 7 of their last 10 games.'
        },
        {
          id: 3,
          homeTeam: 'Barcelona',
          awayTeam: 'Atletico Madrid',
          league: 'La Liga',
          sport: 'football',
          date: new Date(Date.now() + 86400000 * 3).toISOString(),
          prediction: 'Both Teams To Score',
          odds: 1.75,
          confidence: 76,
          analysis: 'Barcelona has scored in their last 12 home games while Atletico has found the net in 9 consecutive away matches.'
        },
        {
          id: 4,
          homeTeam: 'Boston Celtics',
          awayTeam: 'Miami Heat',
          league: 'NBA',
          sport: 'basketball',
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          prediction: 'Home Win',
          odds: 1.65,
          confidence: 85,
          analysis: 'Boston has dominated at home this season with a 18-3 record and has won the last 5 meetings against Miami.'
        }
      ];
      
      // Return randomly selected predictions based on maxSelections
      const selectedPredictions = mockPredictions
        .sort(() => Math.random() - 0.5)
        .slice(0, maxSelections);
      
      const totalOdds = selectedPredictions.reduce((acc, pred) => acc * pred.odds, 1);
      const avgConfidence = selectedPredictions.reduce((acc, pred) => acc + pred.confidence, 0) / selectedPredictions.length;
      
      return {
        id: Date.now(),
        name: `AI Accumulator #${Math.floor(Math.random() * 1000)}`,
        predictions: selectedPredictions,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        confidenceScore: Math.round(avgConfidence),
        createdAt: new Date().toISOString()
      };
    },
    onSuccess: (data) => {
      setGeneratedAccumulator(data);
      setIsGenerating(false);
      toast({
        title: "AI Accumulator Generated",
        description: `Created a ${data.predictions.length}-selection accumulator with ${data.totalOdds.toFixed(2)} odds`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI accumulator. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle save accumulator
  const handleSaveAccumulator = () => {
    if (!generatedAccumulator) return;
    
    setSavedAccumulators(prev => [generatedAccumulator, ...prev]);
    toast({
      title: "Accumulator Saved",
      description: "Your AI accumulator has been saved successfully",
    });
  };
  
  // Handle sport selection
  const toggleSport = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Generate a new accumulator with the current settings
  const generateAccumulator = () => {
    generateMutation.mutate();
  };

  return (
    <div className="pb-20">
      <Helmet>
        <title>AI Accumulator Builder | PuntaIQ</title>
      </Helmet>
      
      {/* Header */}
      <section className="mb-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">AI Builder</h1>
          
          {/* AI Status Badge */}
          <Badge 
            variant={aiStatus.enabled ? "outline" : "destructive"}
            className={`flex items-center gap-1 ${aiStatus.enabled ? "bg-green-500/10" : "bg-destructive/10"}`}
          >
            <Brain size={12} />
            <span className="text-xs">
              {aiStatus.enabled ? 'AI Connected' : 'AI Unavailable'}
            </span>
          </Badge>
        </div>
      </section>
      
      {/* Tabs */}
      <Tabs defaultValue="builder" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedAccumulators.length})</TabsTrigger>
        </TabsList>
        
        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* AI Builder Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3 border-b bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Smart Accumulator Builder
                  </CardTitle>
                  <CardDescription>
                    Generate AI-powered accumulators tailored to your preferences
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {/* Sports Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Sports</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {sports.map(sport => (
                        <Button
                          key={sport.id}
                          type="button"
                          variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                          className="h-auto py-2 px-2 flex flex-col items-center justify-center gap-1"
                          onClick={() => toggleSport(sport.id)}
                        >
                          <span className="text-base">{sport.icon}</span>
                          <span className="text-xs">{sport.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Confidence Level */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium">Minimum Confidence</Label>
                      <span className="text-sm font-medium text-primary">{confidenceLevel}%</span>
                    </div>
                    <Slider
                      value={[confidenceLevel]}
                      min={50}
                      max={95}
                      step={5}
                      onValueChange={(value) => setConfidenceLevel(value[0])}
                      className="my-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Higher Risk</span>
                      <span>Lower Risk</span>
                    </div>
                  </div>
                  
                  {/* Selections Count */}
                  <div>
                    <Label className="text-sm font-medium block mb-2">Number of Selections</Label>
                    <Select
                      value={maxSelections.toString()}
                      onValueChange={(val) => setMaxSelections(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Number of selections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Selections</SelectItem>
                        <SelectItem value="3">3 Selections</SelectItem>
                        <SelectItem value="4">4 Selections</SelectItem>
                        <SelectItem value="5">5 Selections</SelectItem>
                        <SelectItem value="6">6 Selections</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Analysis Depth */}
                  <div>
                    <Label className="text-sm font-medium block mb-2">Analysis Depth</Label>
                    <Select
                      value={analysisDepth}
                      onValueChange={setAnalysisDepth}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Analysis depth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Show AI Explanations */}
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-sm font-medium">Show AI Explanations</Label>
                      <p className="text-xs text-muted-foreground">Include detailed reasoning for each selection</p>
                    </div>
                    <Switch
                      checked={showExplanations}
                      onCheckedChange={setShowExplanations}
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={isGenerating || selectedSports.length === 0}
                    onClick={generateAccumulator}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating Accumulator...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate AI Accumulator
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
            
            {/* Generated Accumulator */}
            {generatedAccumulator && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">Generated Accumulator</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleSaveAccumulator}
                  >
                    Save Accumulator
                  </Button>
                </div>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{generatedAccumulator.name}</CardTitle>
                        <CardDescription>
                          {generatedAccumulator.predictions.length} Selections • {generatedAccumulator.confidenceScore}% Confidence
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{generatedAccumulator.totalOdds.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total Odds</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <Separator />
                  
                  <CardContent className="pt-4 space-y-2">
                    {generatedAccumulator.predictions.map((prediction, index) => (
                      <div key={prediction.id} className="mb-3">
                        <PredictionCard
                          prediction={{
                            id: prediction.id.toString(),
                            matchId: prediction.id.toString(),
                            homeTeam: prediction.homeTeam,
                            awayTeam: prediction.awayTeam,
                            league: prediction.league,
                            sport: prediction.sport || 'football',
                            date: prediction.date,
                            time: new Date(prediction.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                            prediction: prediction.prediction,
                            confidence: prediction.confidence,
                            odds: prediction.odds,
                            isPremium: false
                          }}
                        />
                        
                        {showExplanations && prediction.analysis && (
                          <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">
                            <div className="flex items-start gap-2">
                              <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-xs">{prediction.analysis}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>
        
        {/* Saved Tab */}
        <TabsContent value="saved">
          {savedAccumulators.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {savedAccumulators.map(accumulator => (
                <motion.div key={accumulator.id} variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base">{accumulator.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {accumulator.predictions.length} Selections • Created {new Date(accumulator.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{accumulator.totalOdds.toFixed(2)}</div>
                          <Badge variant="outline" className="text-xs">
                            {accumulator.confidenceScore}% Confidence
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-xs h-8 mt-2"
                      >
                        View Details
                        <ChevronRight size={14} />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
              <h3 className="text-base font-medium mb-1">No Saved Accumulators</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate and save AI accumulators to view them here
              </p>
              <Button onClick={() => setActiveTab('builder')}>
                Create Accumulator
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}