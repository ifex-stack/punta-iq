import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, CheckCircle, PlusCircle, Shield, Shirt, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

type Player = {
  id: number;
  name: string;
  position: string;
  team: string;
  fantasyPointsTotal: number;
  fantasyPointsAvg: number;
  price: number;
  image?: string;
};

type FantasyTeam = {
  id: number;
  name: string;
  formation: string;
  logoUrl: string | null;
  totalPoints: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

type TeamPlayer = {
  id: number;
  teamId: number;
  playerId: number;
  position: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  addedAt: string;
  player?: Player;
};

export default function FantasyTeamBuildPage() {
  const params = useParams();
  const teamId = parseInt(params.teamId);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedPlayers, setSelectedPlayers] = useState<TeamPlayer[]>([]);
  const [captain, setCaptain] = useState<number | null>(null);
  const [viceCaptain, setViceCaptain] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch team details
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/fantasy/teams', teamId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/fantasy/teams/${teamId}`);
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
    enabled: !!teamId && !!user,
  });

  // Fetch available players
  const { data: availablePlayers, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['/api/fantasy/players', selectedPosition],
    queryFn: async () => {
      const positionQuery = selectedPosition !== 'all' ? `?position=${selectedPosition}` : '';
      const res = await apiRequest('GET', `/api/fantasy/players${positionQuery}`);
      if (!res.ok) throw new Error('Failed to fetch players');
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch existing team players
  const { data: teamPlayers, isLoading: isLoadingTeamPlayers } = useQuery({
    queryKey: ['/api/fantasy/teams', teamId, 'players'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/fantasy/teams/${teamId}/players`);
      if (!res.ok) throw new Error('Failed to fetch team players');
      return res.json();
    },
    enabled: !!teamId && !!user,
  });

  // Initialize selected players, captain and vice-captain from team data
  useEffect(() => {
    if (teamPlayers) {
      setSelectedPlayers(teamPlayers);
      
      const captainPlayer = teamPlayers.find(p => p.isCaptain);
      const viceCaptainPlayer = teamPlayers.find(p => p.isViceCaptain);
      
      if (captainPlayer) setCaptain(captainPlayer.playerId);
      if (viceCaptainPlayer) setViceCaptain(viceCaptainPlayer.playerId);
    }
  }, [teamPlayers]);

  // AI auto-fill mutation
  const aiAutoFillMutation = useMutation({
    mutationFn: async (position?: string) => {
      // If no position is specified, the API will pick the best available one
      const res = await apiRequest('POST', `/api/fantasy/teams/${teamId}/ai-autofill`, { 
        position 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to auto-fill player');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/fantasy/teams', teamId, 'players'] });
      toast({
        title: 'Player added',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Auto-fill failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Add player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest('POST', `/api/fantasy/teams/${teamId}/players`, {
        playerId,
        position: getNextAvailablePosition(),
        isCaptain: false,
        isViceCaptain: false
      });
      if (!res.ok) throw new Error('Failed to add player');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fantasy/teams', teamId, 'players'] });
      toast({
        title: 'Player added',
        description: 'Player has been added to your team',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add player',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Remove player mutation
  const removePlayerMutation = useMutation({
    mutationFn: async (teamPlayerId: number) => {
      const res = await apiRequest('DELETE', `/api/fantasy/teams/${teamId}/players/${teamPlayerId}`);
      if (!res.ok) throw new Error('Failed to remove player');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fantasy/teams', teamId, 'players'] });
      toast({
        title: 'Player removed',
        description: 'Player has been removed from your team',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove player',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update captain/vice-captain mutation
  const updateCaptainsMutation = useMutation({
    mutationFn: async () => {
      // Reset all captains first
      await apiRequest('PUT', `/api/fantasy/teams/${teamId}/reset-captains`);
      
      // Set new captain if selected
      if (captain) {
        await apiRequest('PUT', `/api/fantasy/teams/${teamId}/players/${getTeamPlayerIdByPlayerId(captain)}`, {
          isCaptain: true
        });
      }
      
      // Set new vice-captain if selected
      if (viceCaptain) {
        await apiRequest('PUT', `/api/fantasy/teams/${teamId}/players/${getTeamPlayerIdByPlayerId(viceCaptain)}`, {
          isViceCaptain: true
        });
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fantasy/teams', teamId, 'players'] });
      toast({
        title: 'Team updated',
        description: 'Your team captains have been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update captains',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Complete team setup mutation
  const completeTeamSetupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', `/api/fantasy/teams/${teamId}/complete`);
      if (!res.ok) throw new Error('Failed to complete team setup');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Team setup complete',
        description: 'Your team is now ready to compete!',
      });
      // Redirect to the team dashboard
      setLocation('/fantasy/contests');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to complete setup',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const getTeamPlayerIdByPlayerId = (playerId: number): number => {
    const player = selectedPlayers.find(p => p.playerId === playerId);
    return player?.id || 0;
  };
  
  const getFormationPositions = (): { [key: string]: number } => {
    if (!team?.formation) return { defender: 4, midfielder: 4, forward: 2 };
    
    const [defenders, midfielders, forwards] = team.formation.split('-').map(Number);
    return {
      defender: defenders,
      midfielder: midfielders,
      forward: forwards,
    };
  };

  const getNextAvailablePosition = (): number => {
    return selectedPlayers.length + 1;
  };

  const getAvailableSlots = (): { [key: string]: { total: number, used: number } } => {
    const formation = getFormationPositions();
    
    const used = {
      goalkeeper: selectedPlayers.filter(p => p.player?.position === 'goalkeeper').length,
      defender: selectedPlayers.filter(p => p.player?.position === 'defender').length,
      midfielder: selectedPlayers.filter(p => p.player?.position === 'midfielder').length,
      forward: selectedPlayers.filter(p => p.player?.position === 'forward').length,
    };
    
    return {
      goalkeeper: { total: 1, used: used.goalkeeper },
      defender: { total: formation.defender, used: used.defender },
      midfielder: { total: formation.midfielder, used: used.midfielder },
      forward: { total: formation.forward, used: used.forward },
    };
  };

  const canAddPlayer = (position: string): boolean => {
    const slots = getAvailableSlots();
    const positionSlots = slots[position as keyof typeof slots];
    if (!positionSlots) return false;
    
    return positionSlots.used < positionSlots.total;
  };

  const isTeamComplete = (): boolean => {
    const slots = getAvailableSlots();
    return (
      slots.goalkeeper.used === slots.goalkeeper.total &&
      slots.defender.used === slots.defender.total &&
      slots.midfielder.used === slots.midfielder.total &&
      slots.forward.used === slots.forward.total &&
      captain !== null &&
      viceCaptain !== null
    );
  };

  const handleAddPlayer = (player: Player) => {
    if (!canAddPlayer(player.position)) {
      toast({
        title: 'Position limit reached',
        description: `You cannot add more players in the ${player.position} position`,
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedPlayers.some(p => p.playerId === player.id)) {
      toast({
        title: 'Player already in team',
        description: 'This player is already in your team',
        variant: 'destructive',
      });
      return;
    }
    
    addPlayerMutation.mutate(player.id);
  };

  const handleAutoFillTeam = () => {
    // Use the currently selected position if there's one, otherwise let the AI decide
    aiAutoFillMutation.mutate(selectedPosition !== 'all' ? selectedPosition : undefined);
  };

  const handleRemovePlayer = (teamPlayerId: number) => {
    removePlayerMutation.mutate(teamPlayerId);
  };

  const handleSetCaptain = (playerId: number) => {
    if (viceCaptain === playerId) {
      setViceCaptain(null);
    }
    setCaptain(captain === playerId ? null : playerId);
  };

  const handleSetViceCaptain = (playerId: number) => {
    if (captain === playerId) {
      setCaptain(null);
    }
    setViceCaptain(viceCaptain === playerId ? null : playerId);
  };

  const handleSaveCaptains = () => {
    updateCaptainsMutation.mutate();
  };

  const handleCompleteSetup = () => {
    if (!isTeamComplete()) {
      toast({
        title: 'Team incomplete',
        description: 'Please fill all positions and select a captain and vice-captain',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    completeTeamSetupMutation.mutate();
  };

  const renderFormationPlaceholders = () => {
    const slots = getAvailableSlots();
    
    return (
      <div className="mt-4 space-y-6">
        {/* Goalkeeper Row */}
        <div className="flex justify-center gap-2">
          {[...Array(slots.goalkeeper.total)].map((_, i) => {
            const player = selectedPlayers.find(p => p.player?.position === 'goalkeeper' && p.position === i + 1);
            return (
              <div key={`gk-${i}`} className="w-20">
                {player ? (
                  <PlayerCard 
                    player={player} 
                    onRemove={() => handleRemovePlayer(player.id)}
                    isCaptain={captain === player.playerId}
                    isViceCaptain={viceCaptain === player.playerId}
                    onSetCaptain={() => handleSetCaptain(player.playerId)}
                    onSetViceCaptain={() => handleSetViceCaptain(player.playerId)}
                  />
                ) : (
                  <EmptyPlayerSlot 
                    position="GK" 
                    onClick={() => setSelectedPosition('goalkeeper')} 
                    onAiAutoFill={() => aiAutoFillMutation.mutate('goalkeeper')}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Defenders Row */}
        <div className="flex justify-center gap-2">
          {[...Array(slots.defender.total)].map((_, i) => {
            const player = selectedPlayers.find(p => p.player?.position === 'defender' && p.position === i + 2);
            return (
              <div key={`def-${i}`} className="w-20">
                {player ? (
                  <PlayerCard 
                    player={player} 
                    onRemove={() => handleRemovePlayer(player.id)}
                    isCaptain={captain === player.playerId}
                    isViceCaptain={viceCaptain === player.playerId}
                    onSetCaptain={() => handleSetCaptain(player.playerId)}
                    onSetViceCaptain={() => handleSetViceCaptain(player.playerId)}
                  />
                ) : (
                  <EmptyPlayerSlot 
                    position="DEF" 
                    onClick={() => setSelectedPosition('defender')}
                    onAiAutoFill={() => aiAutoFillMutation.mutate('defender')}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Midfielders Row */}
        <div className="flex justify-center gap-2">
          {[...Array(slots.midfielder.total)].map((_, i) => {
            const player = selectedPlayers.find(p => p.player?.position === 'midfielder' && p.position === i + 2 + slots.defender.total);
            return (
              <div key={`mid-${i}`} className="w-20">
                {player ? (
                  <PlayerCard 
                    player={player} 
                    onRemove={() => handleRemovePlayer(player.id)}
                    isCaptain={captain === player.playerId}
                    isViceCaptain={viceCaptain === player.playerId}
                    onSetCaptain={() => handleSetCaptain(player.playerId)}
                    onSetViceCaptain={() => handleSetViceCaptain(player.playerId)}
                  />
                ) : (
                  <EmptyPlayerSlot 
                    position="MID" 
                    onClick={() => setSelectedPosition('midfielder')} 
                    onAiAutoFill={() => aiAutoFillMutation.mutate('midfielder')}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Forwards Row */}
        <div className="flex justify-center gap-2">
          {[...Array(slots.forward.total)].map((_, i) => {
            const player = selectedPlayers.find(p => p.player?.position === 'forward' && p.position === i + 2 + slots.defender.total + slots.midfielder.total);
            return (
              <div key={`fwd-${i}`} className="w-20">
                {player ? (
                  <PlayerCard 
                    player={player} 
                    onRemove={() => handleRemovePlayer(player.id)}
                    isCaptain={captain === player.playerId}
                    isViceCaptain={viceCaptain === player.playerId}
                    onSetCaptain={() => handleSetCaptain(player.playerId)}
                    onSetViceCaptain={() => handleSetViceCaptain(player.playerId)}
                  />
                ) : (
                  <EmptyPlayerSlot 
                    position="FWD" 
                    onClick={() => setSelectedPosition('forward')} 
                    onAiAutoFill={() => aiAutoFillMutation.mutate('forward')}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoadingTeam) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Skeleton className="h-[30rem]" />
            <Skeleton className="h-[30rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => setLocation('/fantasy/contests')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contests
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{team?.name}</h1>
          <p className="text-muted-foreground">
            Formation: {team?.formation} • Build your squad by selecting players for each position
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={handleSaveCaptains}
            disabled={updateCaptainsMutation.isPending}
          >
            Save Captains
          </Button>
          <Button 
            onClick={handleCompleteSetup}
            disabled={!isTeamComplete() || isSubmitting}
          >
            {isSubmitting ? 'Completing...' : 'Complete Team Setup'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Left side - Team formation */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Your Team</CardTitle>
                <CardDescription>
                  Select players for each position. You need 1 goalkeeper, {getFormationPositions().defender} defenders, 
                  {getFormationPositions().midfielder} midfielders, and {getFormationPositions().forward} forwards.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-1" 
                size="sm"
                onClick={() => handleAutoFillTeam()}
              >
                <Zap className="h-4 w-4" /> AI Fill Team
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderFormationPlaceholders()}
            
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2 py-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Captain
                </Badge>
                <span className="text-sm text-muted-foreground">- Player earns 2x points</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2 py-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-muted-foreground" /> Vice Captain
                </Badge>
                <span className="text-sm text-muted-foreground">- Player earns 1.5x points</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full space-y-2">
              <div className="text-sm text-muted-foreground">
                {isTeamComplete() 
                  ? "Your team is complete! Review and click 'Complete Team Setup' to finalize."
                  : "Complete your team by filling all positions and selecting captains."}
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Right side - Player selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Players</CardTitle>
            <CardDescription>
              Choose players to add to your team
            </CardDescription>
            <Tabs defaultValue="all" className="mt-2">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all" onClick={() => setSelectedPosition('all')}>All</TabsTrigger>
                <TabsTrigger value="goalkeeper" onClick={() => setSelectedPosition('goalkeeper')}>GK</TabsTrigger>
                <TabsTrigger value="defender" onClick={() => setSelectedPosition('defender')}>DEF</TabsTrigger>
                <TabsTrigger value="midfielder" onClick={() => setSelectedPosition('midfielder')}>MID</TabsTrigger>
                <TabsTrigger value="forward" onClick={() => setSelectedPosition('forward')}>FWD</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[32rem]">
              {isLoadingPlayers ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : availablePlayers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No players found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePlayers?.map((player: Player) => (
                    <div 
                      key={player.id} 
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={player.image} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{player.team}</span>
                            <span className="mx-1">•</span>
                            <PositionBadge position={player.position} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{player.fantasyPointsTotal} pts</div>
                          <div className="text-xs text-muted-foreground">{player.fantasyPointsAvg}/game</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAddPlayer(player)}
                          disabled={!canAddPlayer(player.position) || selectedPlayers.some(p => p.playerId === player.id)}
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper components

type EmptyPlayerSlotProps = {
  position: string;
  onClick: () => void;
  onAiAutoFill: () => void;
};

const EmptyPlayerSlot = ({ position, onClick, onAiAutoFill }: EmptyPlayerSlotProps) => (
  <div 
    className="h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-accent/25 transition-colors"
  >
    <div className="text-xs text-center font-medium mb-2">{position}</div>
    <div className="flex flex-col space-y-1">
      <button
        onClick={onClick}
        className="px-2 py-1 text-xs rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
      >
        <PlusCircle className="h-3 w-3 mr-1" /> Add
      </button>
      <button
        onClick={onAiAutoFill}
        className="px-2 py-1 text-xs rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center"
      >
        <Zap className="h-3 w-3 mr-1" /> AI Pick
      </button>
    </div>
  </div>
);

type PlayerCardProps = {
  player: TeamPlayer;
  onRemove: () => void;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onSetCaptain: () => void;
  onSetViceCaptain: () => void;
};

const PlayerCard = ({ 
  player, 
  onRemove, 
  isCaptain, 
  isViceCaptain,
  onSetCaptain,
  onSetViceCaptain,
}: PlayerCardProps) => (
  <div className="rounded-lg border bg-card shadow-sm">
    <div className="relative p-2">
      <div className="absolute top-0 right-0 p-1">
        <button 
          className="h-5 w-5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center text-xs"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      
      <div className="flex flex-col items-center">
        <Avatar className="h-10 w-10 mb-1">
          <AvatarImage src={player.player?.image} />
          <AvatarFallback>{player.player?.name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div className="text-xs font-medium line-clamp-1 text-center">
          {player.player?.name || 'Player'}
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1">
          {player.player?.team || '-'}
        </div>
      </div>
      
      <div className="flex justify-center gap-1 mt-2">
        <button 
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            isCaptain 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-primary/20'
          }`}
          onClick={onSetCaptain}
          title="Set as Captain"
        >
          C
        </button>
        <button 
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            isViceCaptain 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-secondary/20'
          }`}
          onClick={onSetViceCaptain}
          title="Set as Vice Captain"
        >
          V
        </button>
      </div>
    </div>
  </div>
);

type PositionBadgeProps = {
  position: string;
};

const PositionBadge = ({ position }: PositionBadgeProps) => {
  const getPositionDetails = (pos: string) => {
    switch (pos.toLowerCase()) {
      case 'goalkeeper':
        return { short: 'GK', icon: <Shield className="h-3 w-3" /> };
      case 'defender':
        return { short: 'DEF', icon: <Shield className="h-3 w-3" /> };
      case 'midfielder':
        return { short: 'MID', icon: <Zap className="h-3 w-3" /> };
      case 'forward':
        return { short: 'FWD', icon: <Shirt className="h-3 w-3" /> };
      default:
        return { short: '?', icon: null };
    }
  };
  
  const details = getPositionDetails(position);
  
  return (
    <Badge variant="outline" className="px-1.5 py-0 h-5 flex items-center gap-1 text-xs">
      {details.icon}
      {details.short}
    </Badge>
  );
};