import React, { useState } from 'react';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { XCircle, PlusCircle } from 'lucide-react';

interface CustomSelection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
}

interface CustomAccumulatorBuilderProps {
  onCancel: () => void;
  onCreateAccumulator: (selections: CustomSelection[], stake: number, riskLevel: string, sport: string) => void;
  sportFilters: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
  }>;
  riskLevels: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

export default function CustomAccumulatorBuilder({
  onCancel,
  onCreateAccumulator,
  sportFilters,
  riskLevels,
}: CustomAccumulatorBuilderProps) {
  const [selections, setSelections] = useState<CustomSelection[]>([
    {
      id: '1',
      homeTeam: 'Manchester United',
      awayTeam: 'Chelsea',
      market: 'match_winner',
      selection: 'home',
      odds: 1.65
    },
    {
      id: '2',
      homeTeam: 'Liverpool',
      awayTeam: 'Arsenal',
      market: 'over_under',
      selection: 'over',
      odds: 1.90
    }
  ]);
  const [stake, setStake] = useState(10);
  const [riskLevel, setRiskLevel] = useState('balanced');
  const [sport, setSport] = useState('football');

  // Calculate total odds and potential return
  const totalOdds = selections.reduce((total, selection) => total * selection.odds, 1);
  const potentialReturn = totalOdds * stake;

  // Add a new selection
  const addSelection = () => {
    const newId = (selections.length + 1).toString();
    setSelections([...selections, {
      id: newId,
      homeTeam: '',
      awayTeam: '',
      market: 'match_winner',
      selection: 'home',
      odds: 1.50
    }]);
  };

  // Remove a selection
  const removeSelection = (id: string) => {
    const filtered = selections.filter(s => s.id !== id);
    if (filtered.length > 0) {
      setSelections(filtered);
    }
  };

  // Update a selection field
  const updateSelection = (index: number, field: keyof CustomSelection, value: string | number) => {
    const newSelections = [...selections];
    newSelections[index] = {
      ...selections[index],
      [field]: value
    };
    setSelections(newSelections);
  };

  // Update market and reset selection based on market type
  const updateMarket = (index: number, market: string) => {
    const newSelections = [...selections];
    newSelections[index] = {
      ...selections[index],
      market,
      selection: market === 'match_winner' ? 'home' : 
                market === 'over_under' ? 'over' : 
                market === 'both_teams_to_score' ? 'yes' : 'home'
    };
    setSelections(newSelections);
  };

  return (
    <Card className="border border-muted-50">
      <CardHeader>
        <CardTitle className="text-center">Build Your Accumulator</CardTitle>
        <CardDescription className="text-center">
          Create your own custom accumulator by selecting markets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Risk Level</h3>
          <Select 
            value={riskLevel}
            onValueChange={setRiskLevel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              {riskLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Sport</h3>
          <Select 
            value={sport}
            onValueChange={setSport}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {sportFilters.filter(s => s.value !== 'all').map(sport => (
                <SelectItem key={sport.value} value={sport.value}>
                  <div className="flex items-center gap-2">
                    {sport.icon}
                    {sport.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Selections</h3>
            <Button variant="outline" size="sm" onClick={addSelection}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Selection
            </Button>
          </div>
          
          <div className="border rounded-md p-4 space-y-4">
            {selections.map((selection, index) => (
              <div key={selection.id} className={`flex flex-col gap-3 ${index < selections.length - 1 ? 'pb-3 border-b' : ''}`}>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Selection {index + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => removeSelection(selection.id)}
                    disabled={selections.length <= 1}
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block">Home Team</label>
                    <Input 
                      placeholder="Home Team" 
                      value={selection.homeTeam}
                      onChange={e => updateSelection(index, 'homeTeam', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block">Away Team</label>
                    <Input 
                      placeholder="Away Team" 
                      value={selection.awayTeam}
                      onChange={e => updateSelection(index, 'awayTeam', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block">Market</label>
                    <Select 
                      value={selection.market}
                      onValueChange={value => updateMarket(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match_winner">Match Winner</SelectItem>
                        <SelectItem value="double_chance">Double Chance</SelectItem>
                        <SelectItem value="both_teams_to_score">Both Teams to Score</SelectItem>
                        <SelectItem value="over_under">Over/Under Goals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block">Selection</label>
                    <Select 
                      value={selection.selection}
                      onValueChange={value => updateSelection(index, 'selection', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select prediction" />
                      </SelectTrigger>
                      <SelectContent>
                        {selection.market === 'match_winner' && (
                          <>
                            <SelectItem value="home">Home Win</SelectItem>
                            <SelectItem value="draw">Draw</SelectItem>
                            <SelectItem value="away">Away Win</SelectItem>
                          </>
                        )}
                        {selection.market === 'double_chance' && (
                          <>
                            <SelectItem value="home_draw">Home or Draw</SelectItem>
                            <SelectItem value="home_away">Home or Away</SelectItem>
                            <SelectItem value="draw_away">Draw or Away</SelectItem>
                          </>
                        )}
                        {selection.market === 'both_teams_to_score' && (
                          <>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </>
                        )}
                        {selection.market === 'over_under' && (
                          <>
                            <SelectItem value="over">Over 2.5 Goals</SelectItem>
                            <SelectItem value="under">Under 2.5 Goals</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs mb-1 block">Odds</label>
                  <Input 
                    type="number" 
                    min="1.01" 
                    step="0.01" 
                    value={selection.odds} 
                    onChange={e => updateSelection(index, 'odds', parseFloat(e.target.value) || 1.01)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Stake Amount ($)</label>
          <Input 
            type="number" 
            min="1" 
            step="1" 
            value={stake} 
            onChange={e => setStake(Number(e.target.value) || 1)}
          />
        </div>
        
        <div className="bg-muted/40 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Total Odds:</span>
            <span className="font-medium">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Potential Return:</span>
            <span className="font-medium text-green-600 dark:text-green-400">${potentialReturn.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button onClick={() => onCreateAccumulator(selections, stake, riskLevel, sport)}>
          Create Accumulator
        </Button>
      </CardFooter>
    </Card>
  );
}