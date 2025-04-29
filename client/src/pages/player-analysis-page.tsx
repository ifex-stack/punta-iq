import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { PlayerSeasonStats, PlayerMatchStats } from '@shared/player-interfaces';
import { 
  ArrowLeft, 
  Lightbulb, 
  User, 
  BarChart4, 
  Footprints,
  Shield,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerPerformanceHints } from '@/components/player-comparison/player-performance-hints';
import { useToast } from '@/hooks/use-toast';

export default function PlayerAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('analysis');
  
  // Get player ID from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const playerId = parseInt(params.get('id') || '0');
  
  // Redirect if no valid player ID
  useEffect(() => {
    if (!playerId) {
      toast({
        title: "Invalid Player",
        description: "No player selected for analysis",
        variant: "destructive"
      });
      setLocation('/player-comparison');
    }
  }, [playerId, toast, setLocation]);
  
  // Fetch player details
  const { data: playerData, isLoading: isPlayerLoading } = useQuery({
    queryKey: ['/api/players', playerId, 'stats'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/stats`);
      if (!res.ok) {
        throw new Error('Failed to fetch player data');
      }
      return res.json();
    },
    enabled: !!playerId,
  });
  
  if (isPlayerLoading || !playerData) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 mb-4" 
            onClick={() => setLocation('/player-comparison')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Player Comparison
          </Button>
          
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  const { player, seasonStats, recentMatches } = playerData;
  
  // Helper function to determine position icon
  const getPositionIcon = () => {
    switch (player.position?.toLowerCase()) {
      case 'goalkeeper':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'defender':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'midfielder':
        return <Footprints className="h-5 w-5 text-amber-500" />;
      case 'forward':
      case 'attacker':
        return <BarChart4 className="h-5 w-5 text-red-500" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 mb-4" 
          onClick={() => setLocation('/player-comparison')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Player Comparison
        </Button>
        
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          {player.name}
          <Badge className="ml-2">
            {getPositionIcon()}
            <span className="ml-1">{player.position}</span>
          </Badge>
        </h1>
        <p className="text-muted-foreground">
          {player.team} • {player.league || 'League not specified'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Season Overview</CardTitle>
              <CardDescription>
                {new Date().getFullYear() - 1}/{new Date().getFullYear()} Season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Appearances</div>
                  <div className="text-2xl font-bold">{seasonStats?.matches || 0}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Minutes</div>
                  <div className="text-2xl font-bold">{seasonStats?.minutesPlayed || 0}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Goals</div>
                  <div className="text-2xl font-bold">{seasonStats?.goals || 0}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Assists</div>
                  <div className="text-2xl font-bold">{seasonStats?.assists || 0}</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                {player.position === 'goalkeeper' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clean Sheets</span>
                      <span className="font-semibold">{seasonStats?.cleanSheets || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Goals Conceded</span>
                      <span className="font-semibold">{seasonStats?.goalsConceded || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saves</span>
                      <span className="font-semibold">{seasonStats?.saves || 0}</span>
                    </div>
                  </>
                )}
                
                {player.position === 'defender' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clean Sheets</span>
                      <span className="font-semibold">{seasonStats?.cleanSheets || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tackles</span>
                      <span className="font-semibold">{seasonStats?.tackles || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Interceptions</span>
                      <span className="font-semibold">{seasonStats?.interceptions || 0}</span>
                    </div>
                  </>
                )}
                
                {player.position === 'midfielder' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pass Accuracy</span>
                      <span className="font-semibold">{seasonStats?.passAccuracy || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Chances Created</span>
                      <span className="font-semibold">{seasonStats?.chancesCreated || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Key Passes</span>
                      <span className="font-semibold">{seasonStats?.keyPasses || 0}</span>
                    </div>
                  </>
                )}
                
                {player.position === 'forward' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Shots</span>
                      <span className="font-semibold">{seasonStats?.shotsTotal || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">On Target</span>
                      <span className="font-semibold">{seasonStats?.shotsOnTarget || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">xG (Expected Goals)</span>
                      <span className="font-semibold">{seasonStats?.xG?.toFixed(2) || '0.00'}</span>
                    </div>
                  </>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Yellow Cards</span>
                  <span className="font-semibold">{seasonStats?.yellowCards || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Red Cards</span>
                  <span className="font-semibold">{seasonStats?.redCards || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fantasy Points</span>
                  <span className="font-semibold">{seasonStats?.fantasyPoints || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    AI Analysis
                  </TabsTrigger>
                  <TabsTrigger value="matches" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Matches
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="analysis" className="mt-0">
                <PlayerPerformanceHints 
                  playerId={playerId}
                  includeMatchContext={true}
                  simplified={false}
                />
              </TabsContent>
              
              <TabsContent value="matches" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Last {recentMatches?.length || 0} Matches</h3>
                  
                  {recentMatches && recentMatches.length > 0 ? (
                    <div className="space-y-4">
                      {recentMatches.map((match: any) => (
                        <Card key={match.matchId} className="overflow-hidden">
                          <div className="bg-muted px-4 py-2 flex justify-between">
                            <div className="font-medium">{match.homeTeam} vs {match.awayTeam}</div>
                            <div className="text-sm text-muted-foreground">
                              {match.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'No date'}
                            </div>
                          </div>
                          
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Minutes</div>
                                <div className="font-medium">{match.minutesPlayed}'</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Goals</div>
                                <div className="font-medium">{match.goals}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Assists</div>
                                <div className="font-medium">{match.assists}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Rating</div>
                                <div className="font-medium">{match.rating?.toFixed(1) || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {match.cleanSheet && (
                                <Badge variant="outline" className="text-xs">Clean Sheet</Badge>
                              )}
                              {match.yellowCards && match.yellowCards > 0 && (
                                <Badge variant="outline" className="text-xs bg-yellow-100">
                                  {match.yellowCards} Yellow Card{match.yellowCards > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {match.redCards && match.redCards > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-100">
                                  {match.redCards} Red Card{match.redCards > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {match.keyPasses && match.keyPasses > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {match.keyPasses} Key Pass{match.keyPasses > 1 ? 'es' : ''}
                                </Badge>
                              )}
                              {match.interceptions && match.interceptions > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {match.interceptions} Interception{match.interceptions > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent match data available for this player.
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}