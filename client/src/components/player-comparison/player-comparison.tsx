import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  UserPlus,
  UserMinus,
  BarChart3, 
  Clock, 
  Award,
  Activity,
  AlertTriangle
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { FootballPlayer } from '@shared/schema';
import { PlayerSeasonStats, PlayerMatchStats } from '@shared/player-interfaces';
import { PlayerPerformanceHints } from './player-performance-hints';

type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

interface PlayerProps {
  id: number;
  name: string;
  position: PlayerPosition;
  team: string;
  league: string;
  imageUrl?: string | null;
  country?: string | null;
  seasonStats?: PlayerSeasonStats | null;
  recentMatches?: PlayerMatchStats[];
}

interface PlayerComparisonProps {
  playerIds?: number[];
  onAddPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  maxPlayers?: number;
}

export function PlayerComparison({ 
  playerIds = [], 
  onAddPlayer,
  onRemovePlayer,
  maxPlayers = 3
}: PlayerComparisonProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  const { data: players, isLoading, error } = useQuery<PlayerProps[]>({
    queryKey: ['/api/players/compare', playerIds.join(',')],
    queryFn: async () => {
      if (playerIds.length < 2) {
        return []; // Need at least 2 players to compare
      }
      const res = await fetch(`/api/players/compare?playerIds=${playerIds.join(',')}`);
      if (!res.ok) {
        throw new Error('Failed to fetch player comparison data');
      }
      return res.json();
    },
    enabled: playerIds.length >= 2,
  });
  
  // Find the best player for a specific stat
  const getBestPlayerForStat = (stat: keyof PlayerSeasonStats) => {
    if (!players || players.length === 0) return null;
    
    let bestPlayerId = players[0].id;
    let bestValue = players[0]?.seasonStats?.[stat] || 0;
    
    players.forEach(player => {
      const value = player?.seasonStats?.[stat] || 0;
      if (typeof value === 'number' && value > bestValue) {
        bestValue = value;
        bestPlayerId = player.id;
      }
    });
    
    return bestPlayerId;
  };
  
  // Calculate the progress value for a stat visualization (0-100)
  const getProgressValue = (value: number | null | undefined, maxValue: number) => {
    if (value === null || value === undefined) return 0;
    const percentage = (value / maxValue) * 100;
    return Math.min(100, Math.max(0, percentage));
  };
  
  // Get color class based on comparison (better=green, worse=red, equal=neutral)
  const getComparisonColor = (playerId: number, stat: keyof PlayerSeasonStats) => {
    const bestId = getBestPlayerForStat(stat);
    if (bestId === null) return '';
    
    return bestId === playerId 
      ? 'bg-green-500' 
      : 'bg-gray-400';
  };

  // Get color for form badge
  const getFormColor = (form: string | null | undefined) => {
    if (!form) return 'bg-gray-400';
    if (form.includes('Excellent')) return 'bg-green-500';
    if (form.includes('Good')) return 'bg-green-400';
    if (form.includes('Average')) return 'bg-yellow-400';
    if (form.includes('Inconsistent')) return 'bg-orange-400';
    return 'bg-red-400';
  };
  
  // Calculate max values for stats to set proper scaling
  const getMaxValues = () => {
    if (!players) return {
      goals: 1, assists: 1, yellowCards: 1, redCards: 1, 
      cleanSheets: 1, passAccuracy: 100, successfulTackles: 1, 
      successfulDribbles: 1, chancesCreated: 1, shotsOnTarget: 1, 
      shotsTotal: 1, xG: 1, xA: 1, fantasyPoints: 1
    };
    
    return {
      goals: Math.max(...players.map(p => p.seasonStats?.goals || 0)) || 1,
      assists: Math.max(...players.map(p => p.seasonStats?.assists || 0)) || 1,
      yellowCards: Math.max(...players.map(p => p.seasonStats?.yellowCards || 0)) || 1,
      redCards: Math.max(...players.map(p => p.seasonStats?.redCards || 0)) || 1,
      cleanSheets: Math.max(...players.map(p => p.seasonStats?.cleanSheets || 0)) || 1,
      passAccuracy: 100, // Always percentage
      successfulTackles: Math.max(...players.map(p => p.seasonStats?.successfulTackles || 0)) || 1,
      successfulDribbles: Math.max(...players.map(p => p.seasonStats?.successfulDribbles || 0)) || 1,
      chancesCreated: Math.max(...players.map(p => p.seasonStats?.chancesCreated || 0)) || 1,
      shotsOnTarget: Math.max(...players.map(p => p.seasonStats?.shotsOnTarget || 0)) || 1,
      shotsTotal: Math.max(...players.map(p => p.seasonStats?.shotsTotal || 0)) || 1,
      xG: Math.max(...players.map(p => p.seasonStats?.xG || 0)) || 1,
      xA: Math.max(...players.map(p => p.seasonStats?.xA || 0)) || 1,
      fantasyPoints: Math.max(...players.map(p => p.seasonStats?.fantasyPoints || 0)) || 1
    };
  };
  
  const maxValues = getMaxValues();
  
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load player data for comparison",
      variant: "destructive"
    });
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Player Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(Math.max(2, playerIds.length))].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!players || players.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Select Players to Compare</h2>
        <p className="text-gray-500 mb-6">Please select at least two players to compare their statistics</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-2xl font-bold mb-4 md:mb-0">Player Comparison</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
            <TabsTrigger value="form">Recent Form</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <motion.div 
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {player.name}
                      {player.seasonStats?.injury && (
                        <span className="ml-2 text-red-500 text-sm">⚠️ Injured</span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {player.team} • {player.position}
                    </CardDescription>
                  </div>
                  {onRemovePlayer && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemovePlayer(player.id)}
                      className="p-1 h-auto"
                    >
                      <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {player.league}
                  </Badge>
                  {player.seasonStats?.form && (
                    <Badge className={`text-xs text-white ${getFormColor(player.seasonStats.form)}`}>
                      {player.seasonStats.form.split(',')[0]}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow pb-6 pt-4">
                <TabsContent value="overview" className="m-0 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Goals</span>
                        <span className="font-medium">{player.seasonStats?.goals || 0}</span>
                      </div>
                      <Progress 
                        value={getProgressValue(player.seasonStats?.goals, maxValues.goals)}
                        className={getComparisonColor(player.id, 'goals')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assists</span>
                        <span className="font-medium">{player.seasonStats?.assists || 0}</span>
                      </div>
                      <Progress 
                        value={getProgressValue(player.seasonStats?.assists, maxValues.assists)}
                        className={getComparisonColor(player.id, 'assists')}
                      />
                    </div>
                    
                    {(player.position === 'goalkeeper' || player.position === 'defender') && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Clean Sheets</span>
                          <span className="font-medium">{player.seasonStats?.cleanSheets || 0}</span>
                        </div>
                        <Progress 
                          value={getProgressValue(player.seasonStats?.cleanSheets, maxValues.cleanSheets)}
                          className={getComparisonColor(player.id, 'cleanSheets')}
                        />
                      </div>
                    )}
                    
                    {player.position === 'midfielder' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Chances Created</span>
                          <span className="font-medium">{player.seasonStats?.chancesCreated || 0}</span>
                        </div>
                        <Progress 
                          value={getProgressValue(player.seasonStats?.chancesCreated, maxValues.chancesCreated)}
                          className={getComparisonColor(player.id, 'chancesCreated')}
                        />
                      </div>
                    )}
                    
                    {player.position === 'forward' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shots on Target</span>
                          <span className="font-medium">{player.seasonStats?.shotsOnTarget || 0}</span>
                        </div>
                        <Progress 
                          value={getProgressValue(player.seasonStats?.shotsOnTarget, maxValues.shotsOnTarget)}
                          className={getComparisonColor(player.id, 'shotsOnTarget')}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fantasy Points</span>
                        <span className="font-medium">{player.seasonStats?.fantasyPoints || 0}</span>
                      </div>
                      <Progress 
                        value={getProgressValue(player.seasonStats?.fantasyPoints, maxValues.fantasyPoints)}
                        className={getComparisonColor(player.id, 'fantasyPoints')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {player.seasonStats?.minutesPlayed || 0} mins
                        </Badge>
                        
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {player.seasonStats?.matches || 0} matches
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="stats" className="m-0 space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Goals</div>
                        <div className="text-lg font-semibold">{player.seasonStats?.goals || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Assists</div>
                        <div className="text-lg font-semibold">{player.seasonStats?.assists || 0}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Games</div>
                        <div className="text-md font-semibold">{player.seasonStats?.matches || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Yellow</div>
                        <div className="text-md font-semibold">{player.seasonStats?.yellowCards || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Red</div>
                        <div className="text-md font-semibold">{player.seasonStats?.redCards || 0}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Pass Accuracy</span>
                          <span className="font-medium">{player.seasonStats?.passAccuracy || 0}%</span>
                        </div>
                        <Progress 
                          value={player.seasonStats?.passAccuracy || 0}
                          className={getComparisonColor(player.id, 'passAccuracy')}
                        />
                      </div>
                      
                      {(player.position === 'defender' || player.position === 'midfielder') && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Tackles</span>
                            <span className="font-medium">{player.seasonStats?.successfulTackles || 0}</span>
                          </div>
                          <Progress 
                            value={getProgressValue(player.seasonStats?.successfulTackles, maxValues.successfulTackles)}
                            className={getComparisonColor(player.id, 'successfulTackles')}
                          />
                        </div>
                      )}
                      
                      {(player.position === 'midfielder' || player.position === 'forward') && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Dribbles</span>
                            <span className="font-medium">{player.seasonStats?.successfulDribbles || 0}</span>
                          </div>
                          <Progress 
                            value={getProgressValue(player.seasonStats?.successfulDribbles, maxValues.successfulDribbles)}
                            className={getComparisonColor(player.id, 'successfulDribbles')}
                          />
                        </div>
                      )}
                      
                      {(player.position === 'forward') && (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">xG (Expected Goals)</span>
                              <span className="font-medium">{player.seasonStats?.xG?.toFixed(2) || '0.00'}</span>
                            </div>
                            <Progress 
                              value={getProgressValue(player.seasonStats?.xG, maxValues.xG)}
                              className={getComparisonColor(player.id, 'xG')}
                            />
                          </div>
                        </>
                      )}
                      
                      {(player.position === 'midfielder') && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">xA (Expected Assists)</span>
                            <span className="font-medium">{player.seasonStats?.xA?.toFixed(2) || '0.00'}</span>
                          </div>
                          <Progress 
                            value={getProgressValue(player.seasonStats?.xA, maxValues.xA)}
                            className={getComparisonColor(player.id, 'xA')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="form" className="m-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Recent Form</div>
                      <Badge className={`text-white ${getFormColor(player.seasonStats?.form)}`}>
                        {player.seasonStats?.form || 'No form data'}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    {/* AI Performance Hints */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium">AI Performance Analysis</div>
                      <div className="space-y-3">
                        <PlayerPerformanceHints 
                          playerId={player.id}
                          simplified={true}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 text-xs"
                          onClick={() => window.location.href = `/fantasy/player-analysis?id=${player.id}`}
                        >
                          View Detailed Analysis
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Last 5 matches</div>
                      {player.recentMatches && player.recentMatches.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {player.recentMatches.map((match) => (
                            <Card key={match.matchId} className="p-3">
                              <div className="flex justify-between text-sm mb-2">
                                <div className="font-medium">vs {match.opponent}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(match.matchDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                <Badge variant="outline" className="flex justify-center items-center gap-1">
                                  {match.goals} {match.goals === 1 ? 'Goal' : 'Goals'}
                                </Badge>
                                <Badge variant="outline" className="flex justify-center items-center gap-1">
                                  {match.assists} {match.assists === 1 ? 'Assist' : 'Assists'}
                                </Badge>
                                <Badge variant="outline" className="flex justify-center items-center gap-1">
                                  {match.minutesPlayed}' Played
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <div className="text-xs">
                                  {match.cleanSheet && (
                                    <Badge variant="secondary" className="text-xs mr-1">Clean Sheet</Badge>
                                  )}
                                  {match.yellowCards > 0 && (
                                    <span className="bg-yellow-400 px-1 text-black rounded mr-1">YC</span>
                                  )}
                                  {match.redCards > 0 && (
                                    <span className="bg-red-500 px-1 text-white rounded">RC</span>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs text-muted-foreground mr-1">Rating:</span>
                                  <span className={`text-sm font-semibold ${match.rating >= 7 ? 'text-green-500' : match.rating <= 5 ? 'text-red-500' : ''}`}>
                                    {match.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No recent match data available</div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {/* Add player card if we have less than max players */}
        {players.length < maxPlayers && onAddPlayer && (
          <Card className="h-full border-dashed border-2 flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <Button onClick={() => toast({
                title: "Add Player",
                description: "Search for players to add to the comparison",
              })}>
                Add Player
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Compare up to {maxPlayers} players
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}