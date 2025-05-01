import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Activity, BarChart3, GanttChart, Dumbbell } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Create a local interface that matches the server-side StandardizedMatch
interface StandardizedMatch {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  score: {
    home: number | null;
    away: number | null;
  };
  time?: {
    minutes?: number;
    seconds?: number;
    period?: number;
  };
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
  };
  isPopular?: boolean;
}

const REFRESH_INTERVAL = 60000; // 60 seconds

type LiveScoreResult = {
  success: boolean;
  data: StandardizedMatch[];
  count: number;
  timestamp: string;
};

type LiveScoresBySportResult = {
  success: boolean;
  data: Record<string, StandardizedMatch[]>;
  sportCounts: { sport: string; count: number }[];
  totalCount: number;
  timestamp: string;
};

// Get sport icon based on sport name
const getSportIcon = (sport: string) => {
  switch (sport.toLowerCase()) {
    case 'football':
      return <Activity className="h-5 w-5" />;
    case 'basketball':
      return <BarChart3 className="h-5 w-5" />;
    case 'volleyball':
      return <GanttChart className="h-5 w-5" />;
    case 'baseball':
      return <Dumbbell className="h-5 w-5" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

// Format time display for live matches
const formatMatchTime = (match: StandardizedMatch) => {
  if (!match.time) return 'LIVE';
  
  const { minutes, seconds, period } = match.time;
  
  if (minutes !== undefined) {
    const formattedSeconds = seconds !== undefined ? `:${seconds.toString().padStart(2, '0')}` : '';
    return `${minutes}${formattedSeconds}`;
  }
  
  if (period !== undefined) {
    switch (match.sport.toLowerCase()) {
      case 'basketball':
        return `Q${period}`;
      case 'american_football':
        return `Q${period}`;
      case 'hockey':
        return `P${period}`;
      default:
        return `LIVE`;
    }
  }
  
  return 'LIVE';
};

// Single match score card component
const LiveMatchCard = ({ match }: { match: StandardizedMatch }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 overflow-hidden border-l-4" 
        style={{ borderLeftColor: match.status === 'in_play' ? '#22c55e' : '#64748b' }}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getSportIcon(match.sport)}
              <Badge variant="outline">{match.league}</Badge>
            </div>
            <div className="flex items-center">
              <Badge 
                variant={match.status === 'in_play' ? "success" : "secondary"}
                className="animate-pulse"
              >
                {match.status === 'in_play' ? formatMatchTime(match) : match.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 items-center py-2">
            {/* Home Team */}
            <div className="col-span-5 text-right">
              <p className="font-bold">{match.homeTeam}</p>
            </div>
            
            {/* Score */}
            <div className="col-span-2 flex justify-center items-center">
              <div className="text-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md font-bold">
                {match.score.home !== null ? match.score.home : '-'}
                <span className="px-1">:</span>
                {match.score.away !== null ? match.score.away : '-'}
              </div>
            </div>
            
            {/* Away Team */}
            <div className="col-span-5 text-left">
              <p className="font-bold">{match.awayTeam}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          {new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          {' • '}{match.country}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const LiveScorePage = () => {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const { toast } = useToast();
  
  // Fetch all live scores
  const { 
    data: liveScoresData,
    isLoading: isLoadingLiveScores,
    error: liveScoresError,
    refetch: refetchLiveScores
  } = useQuery<LiveScoreResult>({
    queryKey: ['/api/live-scores', { sport: selectedSport }],
    refetchInterval: REFRESH_INTERVAL,
  });
  
  // Fetch scores by sport for the dashboard view
  const {
    data: liveScoresBySport, 
    isLoading: isLoadingBySport,
    error: bySportError,
    refetch: refetchBySport
  } = useQuery<LiveScoresBySportResult>({
    queryKey: ['/api/live-scores/by-sport'],
    refetchInterval: REFRESH_INTERVAL,
  });
  
  // Fetch popular live scores
  const {
    data: popularLiveScores,
    isLoading: isLoadingPopular,
    error: popularError,
    refetch: refetchPopular
  } = useQuery<LiveScoreResult>({
    queryKey: ['/api/live-scores/popular'],
    refetchInterval: REFRESH_INTERVAL,
  });

  // Manual refresh handler
  const handleRefresh = () => {
    refetchLiveScores();
    refetchBySport();
    refetchPopular();
    toast({
      title: "Refreshed",
      description: "Live scores have been updated",
      duration: 3000,
    });
  };

  // Handle errors
  useEffect(() => {
    if (liveScoresError || bySportError || popularError) {
      toast({
        title: "Error loading live scores",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [liveScoresError, bySportError, popularError, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">LiveScore</h1>
          <p className="text-muted-foreground">Real-time scores from matches in progress</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          disabled={isLoadingLiveScores || isLoadingBySport || isLoadingPopular}
        >
          {isLoadingLiveScores || isLoadingBySport || isLoadingPopular ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="bysport">By Sport</TabsTrigger>
        </TabsList>
        
        {/* All Matches Tab */}
        <TabsContent value="all">
          <div className="mb-6">
            <Select 
              value={selectedSport} 
              onValueChange={setSelectedSport}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="baseball">Baseball</SelectItem>
                <SelectItem value="hockey">Hockey</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoadingLiveScores ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : liveScoresData?.data && liveScoresData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveScoresData.data.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No live matches available at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for live updates</p>
            </div>
          )}
        </TabsContent>
        
        {/* Popular Tab */}
        <TabsContent value="popular">
          {isLoadingPopular ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : popularLiveScores?.data && popularLiveScores.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularLiveScores.data.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No popular matches in play right now</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for live updates</p>
            </div>
          )}
        </TabsContent>
        
        {/* By Sport Tab */}
        <TabsContent value="bysport">
          {isLoadingBySport ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : liveScoresBySport?.data ? (
            <div className="space-y-8">
              {liveScoresBySport.sportCounts && liveScoresBySport.sportCounts.length > 0 ? (
                Object.keys(liveScoresBySport.data).map((sport) => (
                  <div key={sport}>
                    <div className="flex items-center gap-2 mb-4">
                      {getSportIcon(sport)}
                      <h2 className="text-xl font-bold capitalize">{sport}</h2>
                      <Badge>{liveScoresBySport.data[sport].length} Live</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {liveScoresBySport.data[sport].map((match) => (
                        <LiveMatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">No live matches available by sport</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back later for live updates</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Last updated timestamp */}
      {(liveScoresData?.timestamp || liveScoresBySport?.timestamp || popularLiveScores?.timestamp) && (
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Last updated: {new Date(liveScoresData?.timestamp || liveScoresBySport?.timestamp || popularLiveScores?.timestamp || Date.now()).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default LiveScorePage;