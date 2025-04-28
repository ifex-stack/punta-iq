import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  UsersRound, 
  ChevronsRight, 
  ArrowRightLeft,
  Info,
  Scale,
  Award,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlayerComparison } from "@/components/player-comparison/player-comparison";
import { PlayerSelector } from "@/components/player-comparison/player-selector";

export default function PlayerComparisonPage() {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const { toast } = useToast();
  
  const handleAddPlayer = (playerId: number) => {
    if (selectedPlayerIds.length >= 3) {
      toast({
        title: "Maximum players reached",
        description: "You can compare up to 3 players at a time",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedPlayerIds.includes(playerId)) {
      toast({
        title: "Player already selected",
        description: "This player is already in your comparison",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPlayerIds([...selectedPlayerIds, playerId]);
  };
  
  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Player Comparison</h1>
          <p className="text-muted-foreground">
            Compare player stats and performance to make informed decisions
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <UsersRound className="mr-2 h-5 w-5" />
                  Player Selection
                </CardTitle>
                <CardDescription>
                  Select players to compare their stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerSelector 
                  onSelectPlayer={handleAddPlayer} 
                  selectedPlayerIds={selectedPlayerIds}
                />
                
                {selectedPlayerIds.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Players:</h4>
                      {selectedPlayerIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No players selected
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {selectedPlayerIds.map((id, index) => (
                            <div key={id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                  {index + 1}
                                </span>
                                <span>Player ID: {id}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemovePlayer(id)} 
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Remove</span>
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Comparison Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <ArrowRightLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Compare up to 3 players</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">View head-to-head stats</span>
                  </div>
                  
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Analyze recent form</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Identify top performers</span>
                  </div>
                </div>
                
                <Separator />
                
                <p className="text-xs text-muted-foreground">
                  Green bars indicate best performance in that specific statistic when comparing players
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <Card className="w-full h-full">
            <CardContent className="p-6">
              <PlayerComparison
                playerIds={selectedPlayerIds}
                onRemovePlayer={handleRemovePlayer}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}