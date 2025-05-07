import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AIConfidenceVisualizer from './ai-confidence-visualizer';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  PlusCircle, MinusCircle, Sparkles, Zap, Target, TrendingUp, BarChart,
  Save, ArrowRight, Info, Brain, AlertCircle, CheckCircle, XCircle,
  Percent, RefreshCw, Flame, ChevronDown, ChevronUp
} from 'lucide-react';

// Define interfaces
interface Selection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  market: string;
  selection: string;
  odds: number;
  confidence: number;
  compatibilityScore?: number;
}

interface ConfidenceFactor {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

interface SmartAccumulatorBuilderProps {
  onSaveAccumulator: (accumulator: any) => void;
  riskLevel: string;
  sportFilter: string;
  className?: string;
}

const SmartAccumulatorBuilder: React.FC<SmartAccumulatorBuilderProps> = ({
  onSaveAccumulator,
  riskLevel,
  sportFilter,
  className
}) => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState(10);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Available matches 
  const { data: availableMatches, isLoading: loadingMatches } = useQuery<any>({
    queryKey: ['/api/predictions/available-matches', { sport: sportFilter }],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Filter matches based on search query
  const filteredMatches = React.useMemo(() => {
    if (!availableMatches) return [];
    
    if (!searchQuery.trim()) return availableMatches;
    
    const query = searchQuery.toLowerCase();
    return availableMatches.filter((match: any) => 
      match.homeTeam.toLowerCase().includes(query) || 
      match.awayTeam.toLowerCase().includes(query) ||
      match.league.toLowerCase().includes(query)
    );
  }, [availableMatches, searchQuery]);
  
  // Calculate total odds and potential return
  const totalOdds = selections.reduce((total, s) => total * s.odds, 1);
  const potentialReturn = (totalOdds * stake).toFixed(2);
  
  // Calculate overall confidence
  const calculateOverallConfidence = useCallback(() => {
    if (selections.length === 0) return 0;
    
    // Base confidence is the weighted average of selection confidences
    const baseConfidence = selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length;
    
    // Apply risk level adjustment
    let adjustedConfidence = baseConfidence;
    if (riskLevel === 'safe') adjustedConfidence += 10;
    if (riskLevel === 'risky') adjustedConfidence -= 10;
    if (riskLevel === 'high-risk') adjustedConfidence -= 15;
    if (riskLevel === 'ultra') adjustedConfidence -= 20;
    
    // Apply size penalty for large accumulators
    if (selections.length > 3) {
      adjustedConfidence -= (selections.length - 3) * 2;
    }
    
    return Math.max(10, Math.min(95, Math.round(adjustedConfidence)));
  }, [selections, riskLevel]);
  
  // Add a selection
  const addSelection = (match: any) => {
    // Check if already in selections
    if (selections.some(s => s.id === match.id)) return;
    
    const newSelection: Selection = {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      startTime: match.startTime,
      market: 'match_winner',
      selection: 'home',
      odds: match.homeOdds || 1.5,
      confidence: match.homeConfidence || 65
    };
    
    setSelections(prev => [...prev, newSelection]);
  };
  
  // Remove a selection
  const removeSelection = (id: string) => {
    setSelections(selections.filter(s => s.id !== id));
  };
  
  // Update a selection's market and choice
  const updateSelection = (id: string, field: keyof Selection, value: any) => {
    setSelections(selections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };
  
  // Optimize the accumulator with AI assistance
  const optimizeAccumulator = () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization process
    setTimeout(() => {
      // Update confidence scores based on compatibility
      const updatedSelections = selections.map(s => ({
        ...s,
        compatibilityScore: Math.random() * 100
      }));
      
      setSelections(updatedSelections);
      setIsOptimizing(false);
    }, 1500);
  };
  
  // Get confidence breakdown factors
  const getConfidenceFactors = (): ConfidenceFactor[] => {
    // If no selections, return empty array
    if (selections.length === 0) return [];
    
    const selectionConfidence = Math.round(
      selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length
    );
    
    const oddsImpact = Math.round(100 - Math.min(100, totalOdds * 3));
    
    const sizeRisk = Math.max(10, Math.min(90, 100 - (selections.length * 8)));
    
    const compatibilityScore = selections.some(s => s.compatibilityScore) 
      ? Math.round(
          selections.reduce((sum, s) => sum + (s.compatibilityScore || 50), 0) / selections.length
        )
      : 70;
    
    return [
      {
        label: 'Selection Quality',
        value: selectionConfidence,
        icon: <Target className="h-3.5 w-3.5 text-blue-500" />,
        description: 'The average confidence score of individual selections.'
      },
      {
        label: 'Odds Risk',
        value: oddsImpact,
        icon: <Percent className="h-3.5 w-3.5 text-violet-500" />,
        description: 'How the total odds impact probability of success.'
      },
      {
        label: 'Size Risk',
        value: sizeRisk,
        icon: <BarChart className="h-3.5 w-3.5 text-amber-500" />,
        description: 'The risk associated with the number of selections.'
      },
      {
        label: 'Compatibility',
        value: compatibilityScore,
        icon: <Zap className="h-3.5 w-3.5 text-emerald-500" />,
        description: 'How well the selections work together based on AI analysis.'
      }
    ];
  };
  
  // Save the built accumulator
  const saveAccumulator = () => {
    if (selections.length === 0) return;
    
    const accumulator = {
      id: `custom-${Date.now()}`,
      name: `${selections.length}-Fold ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Accumulator`,
      description: `Custom built accumulator with ${selections.length} selections`,
      selections,
      totalOdds,
      potentialReturn: `$${potentialReturn}`,
      confidence: calculateOverallConfidence(),
      stake,
      marketType: 'mixed',
      sport: sportFilter === 'all' ? 'Mixed' : sportFilter,
      colorTheme: '',
      isCustom: true
    };
    
    onSaveAccumulator(accumulator);
  };
  
  // Update available match odds based on market selection
  const updateMarketAndOdds = (id: string, market: string) => {
    const selection = selections.find(s => s.id === id);
    if (!selection) return;
    
    const match = availableMatches?.find((m: any) => m.id === id);
    if (!match) return;
    
    let newOdds = 1.5;
    let newSelection = '';
    let newConfidence = 50;
    
    switch(market) {
      case 'match_winner':
        newOdds = match.homeOdds || 1.5;
        newSelection = 'home';
        newConfidence = match.homeConfidence || 60;
        break;
      case 'double_chance':
        newOdds = match.doubleChanceHomeDrawOdds || 1.2;
        newSelection = 'home_draw';
        newConfidence = Math.min(85, (match.homeConfidence || 60) + 15);
        break;
      case 'over_under':
        newOdds = match.overOdds || 1.9;
        newSelection = 'over';
        newConfidence = match.overConfidence || 55;
        break;
      case 'btts':
        newOdds = match.bttsYesOdds || 1.8;
        newSelection = 'yes';
        newConfidence = match.bttsConfidence || 60;
        break;
    }
    
    setSelections(selections.map(s => 
      s.id === id ? { 
        ...s, 
        market, 
        selection: newSelection,
        odds: newOdds,
        confidence: newConfidence
      } : s
    ));
  };
  
  // Customize selection details
  const customizeSelection = (id: string, selection: string, odds: number, confidence: number) => {
    setSelections(selections.map(s => 
      s.id === id ? { ...s, selection, odds, confidence } : s
    ));
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Accumulator Builder
        </CardTitle>
        <CardDescription>
          Build custom accumulators with AI assistance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-5">
        {/* AI Assistant Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-medium">AI Assistance</h3>
              <p className="text-xs text-muted-foreground">Get AI recommendations and insights</p>
            </div>
          </div>
          <Switch
            checked={aiAssistEnabled}
            onCheckedChange={setAiAssistEnabled}
          />
        </div>
        
        {/* Match Search */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Search Teams or Leagues</Label>
          <div className="relative">
            <Input
              placeholder="Search for matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchQuery('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Available Matches */}
        <div>
          <h3 className="text-sm font-medium mb-2">Available Matches</h3>
          <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
            {loadingMatches ? (
              <div className="p-4 text-center">
                <RefreshCw className="h-6 w-6 animate-spin opacity-70 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading matches...</p>
              </div>
            ) : filteredMatches?.length ? (
              <div className="divide-y">
                {filteredMatches.map((match: any) => (
                  <div 
                    key={match.id}
                    className="flex justify-between items-center p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{match.league}</span>
                        {match.isPremium && (
                          <Badge variant="outline" className="py-0 px-1">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{match.homeTeam} vs {match.awayTeam}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(match.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addSelection(match)}
                      disabled={selections.some(s => s.id === match.id)}
                    >
                      {selections.some(s => s.id === match.id) ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <PlusCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <AlertCircle className="h-6 w-6 opacity-70 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No matches found</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Selected Matches */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Your Selections ({selections.length})</h3>
            {selections.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setSelections([])}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-3 mb-4">
            <AnimatePresence initial={false}>
              {selections.map((selection, index) => (
                <motion.div
                  key={selection.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="p-3 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">{selection.league}</span>
                          {selection.compatibilityScore && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant={selection.compatibilityScore > 70 ? "default" : "outline"}>
                                    <Zap className="h-3 w-3 mr-0.5" />
                                    {selection.compatibilityScore.toFixed(0)}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">AI Compatibility Score</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-sm font-medium my-0.5">{selection.homeTeam} vs {selection.awayTeam}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selection.startTime).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeSelection(selection.id)}
                      >
                        <MinusCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <Label className="text-xs mb-1 block">Market</Label>
                        <Select
                          value={selection.market}
                          onValueChange={(value) => updateMarketAndOdds(selection.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select market" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="match_winner">Match Winner</SelectItem>
                            <SelectItem value="double_chance">Double Chance</SelectItem>
                            <SelectItem value="over_under">Over/Under Goals</SelectItem>
                            <SelectItem value="btts">Both Teams to Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs mb-1 block">Selection</Label>
                        <Select
                          value={selection.selection}
                          onValueChange={(value) => updateSelection(selection.id, 'selection', value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            {selection.market === 'match_winner' && (
                              <>
                                <SelectItem value="home">{selection.homeTeam}</SelectItem>
                                <SelectItem value="draw">Draw</SelectItem>
                                <SelectItem value="away">{selection.awayTeam}</SelectItem>
                              </>
                            )}
                            {selection.market === 'double_chance' && (
                              <>
                                <SelectItem value="home_draw">{selection.homeTeam} or Draw</SelectItem>
                                <SelectItem value="home_away">{selection.homeTeam} or {selection.awayTeam}</SelectItem>
                                <SelectItem value="draw_away">Draw or {selection.awayTeam}</SelectItem>
                              </>
                            )}
                            {selection.market === 'over_under' && (
                              <>
                                <SelectItem value="over">Over 2.5 Goals</SelectItem>
                                <SelectItem value="under">Under 2.5 Goals</SelectItem>
                              </>
                            )}
                            {selection.market === 'btts' && (
                              <>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <Label className="text-xs mb-1 block">Odds</Label>
                        <Input
                          type="number"
                          value={selection.odds}
                          onChange={(e) => updateSelection(selection.id, 'odds', parseFloat(e.target.value) || 1.01)}
                          className="h-8 text-xs w-20"
                          min={1.01}
                          step={0.01}
                        />
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 mb-1">
                          <Label className="text-xs">Confidence:</Label>
                          <span className="text-xs font-medium">{selection.confidence}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              selection.confidence >= 70 ? 'bg-green-500' :
                              selection.confidence >= 50 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${selection.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {selections.length === 0 && (
              <div className="text-center p-6 border border-dashed rounded-md">
                <AlertCircle className="h-10 w-10 opacity-20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No selections added yet</p>
                <p className="text-xs text-muted-foreground">
                  Search and select matches to build your accumulator
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Stake Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-sm">Stake Amount</Label>
            <span className="text-sm font-medium">${stake}</span>
          </div>
          <Slider
            value={[stake]}
            onValueChange={(value) => setStake(value[0])}
            min={1}
            max={100}
            step={1}
            className="my-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$1</span>
            <span>$50</span>
            <span>$100</span>
          </div>
        </div>
        
        {/* Advanced Options Toggle */}
        <div 
          className="flex justify-between items-center py-1 cursor-pointer"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <span className="text-sm font-medium">Advanced Options</span>
          {showAdvancedOptions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
        
        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox id="autoAdjustValue" />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="autoAdjustValue"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Auto-adjust odds for value
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically adjust odds for better value based on AI analysis
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox id="earlySettlement" />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="earlySettlement"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Reduce risk with insurance
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Apply AI-powered insurance to reduce risk (affects potential return)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* AI Confidence Analysis */}
        {selections.length > 0 && aiAssistEnabled && (
          <AIConfidenceVisualizer
            overallConfidence={calculateOverallConfidence()}
            factors={getConfidenceFactors()}
            className="mt-4"
          />
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Total Odds:</p>
              <Badge variant="outline">{totalOdds.toFixed(2)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential Return: <span className="font-semibold">${potentialReturn}</span>
            </p>
          </div>
          
          {aiAssistEnabled && selections.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={optimizeAccumulator}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Optimize
                </>
              )}
            </Button>
          )}
        </div>
        
        <Button
          className="w-full gap-1.5"
          onClick={saveAccumulator}
          disabled={selections.length === 0}
        >
          <Save className="h-4 w-4" />
          Save Accumulator
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SmartAccumulatorBuilder;