import { useState, useRef, useEffect } from 'react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList 
} from "@/components/ui/command";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ChevronsUpDown, 
  UserPlus,
  Search,
  XCircle,
  Loader2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";

interface PlayerSelectorProps {
  onSelectPlayer: (playerId: number) => void;
  selectedPlayerIds: number[];
  limit?: number;
}

interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  league: string;
  fantasyPointsTotal: number;
}

export function PlayerSelector({ 
  onSelectPlayer, 
  selectedPlayerIds,
  limit = 3 
}: PlayerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: players, isLoading, refetch } = useQuery<Player[]>({
    queryKey: ['/api/fantasy/players', searchQuery, position, team],
    queryFn: async () => {
      let url = '/api/fantasy/players';
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (position) {
        params.append('position', position);
      }
      
      if (team) {
        params.append('team', team);
      }
      
      params.append('limit', '20');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch players');
      }
      return res.json();
    },
    enabled: open,
  });
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setPosition(null);
    setTeam(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const positionFilters = [
    { id: 'goalkeeper', label: 'Goalkeeper' },
    { id: 'defender', label: 'Defender' },
    { id: 'midfielder', label: 'Midfielder' },
    { id: 'forward', label: 'Forward' },
  ];
  
  const teamFilters = [
    'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Tottenham', 
    'Manchester United', 'Everton', 'Newcastle', 'Leicester', 'Wolves'
  ].sort();
  
  const handleSelectPlayer = (playerId: number) => {
    onSelectPlayer(playerId);
    setOpen(false);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Compare Players</h3>
          <Badge variant="secondary">
            {selectedPlayerIds.length} of {limit} selected
          </Badge>
        </div>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              disabled={selectedPlayerIds.length >= limit}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Player
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="end">
            <Command>
              <CommandInput 
                placeholder="Search players..." 
                onValueChange={handleSearchChange}
                ref={inputRef}
              />
              
              <div className="flex flex-wrap gap-1 p-2 border-b border-border">
                <div className="mr-1 text-xs text-muted-foreground flex items-center">
                  Filters:
                </div>
                
                {position && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {position}
                    <XCircle
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => setPosition(null)}
                    />
                  </Badge>
                )}
                
                {team && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {team}
                    <XCircle
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => setTeam(null)}
                    />
                  </Badge>
                )}
                
                {(position || team) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 text-xs px-2" 
                    onClick={handleClearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="flex border-b border-border">
                <div className="p-1 flex flex-wrap gap-1">
                  {positionFilters.map((pos) => (
                    <Badge 
                      key={pos.id}
                      variant={position === pos.id ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setPosition(position === pos.id ? null : pos.id)}
                    >
                      {pos.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <CommandList>
                {isLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Searching players...</p>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>
                      <div className="py-6 text-center">
                        <Search className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm">No players found. Try a different search.</p>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {players?.map((player) => (
                        <CommandItem
                          key={player.id}
                          onSelect={() => handleSelectPlayer(player.id)}
                          disabled={selectedPlayerIds.includes(player.id)}
                          className={selectedPlayerIds.includes(player.id) ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-medium">{player.name}</span>
                              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                <span>{player.team}</span>
                                <span className="mx-1">•</span>
                                <span>{player.position}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              {selectedPlayerIds.includes(player.id) && (
                                <Check className="h-4 w-4 mr-1 text-primary" />
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}