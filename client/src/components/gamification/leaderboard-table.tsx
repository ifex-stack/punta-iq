import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  UserIcon,
  MedalIcon,
  SparkleIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface LeaderboardEntry {
  id: number;
  userId: number;
  leaderboardId: number;
  rank: number;
  previousRank: number | null;
  points: number;
  username: string;
  avatarUrl?: string;
  details: {
    winStreak?: number;
    totalCorrect?: number;
    accuracy?: number;
    gamesPlayed?: number;
    perfectPredictions?: number;
    contestsWon?: number;
    referrals?: number;
    [key: string]: any;
  };
  lastUpdated: Date;
}

export interface Leaderboard {
  id: number;
  name: string;
  type: 'weekly' | 'monthly' | 'seasonal' | 'all_time' | 'fantasy' | 'prediction_accuracy';
  description: string;
  rules: any;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  entries: LeaderboardEntry[];
}

const LeaderboardRow = ({ entry, rank, currentUserId }: { 
  entry: LeaderboardEntry;
  rank: number;
  currentUserId: number;
}) => {
  const isCurrentUser = entry.userId === currentUserId;
  const positionChange = entry.previousRank ? entry.previousRank - entry.rank : 0;
  
  let positionIcon = <MinusIcon className="h-4 w-4 text-muted-foreground" />;
  let positionClass = "text-muted-foreground";
  
  if (positionChange > 0) {
    positionIcon = <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    positionClass = "text-green-500";
  } else if (positionChange < 0) {
    positionIcon = <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    positionClass = "text-red-500";
  }
  
  return (
    <TableRow className={`${isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''} transition-colors`}>
      <TableCell className="font-semibold text-center">
        {rank <= 3 ? (
          <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br">
            {rank === 1 && <MedalIcon className="h-5 w-5 text-yellow-400" />}
            {rank === 2 && <MedalIcon className="h-5 w-5 text-slate-400" />}
            {rank === 3 && <MedalIcon className="h-5 w-5 text-amber-800" />}
          </div>
        ) : (
          <span>{rank}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.avatarUrl} />
            <AvatarFallback className="bg-primary/10">
              <UserIcon className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{entry.username}</div>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">You</Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="font-semibold">{entry.points}</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-end gap-1">
          {positionIcon}
          <span className={positionClass}>
            {positionChange !== 0 && Math.abs(positionChange)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};

const LeaderboardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div>
      <div className="h-4 w-1/2 bg-muted/80 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-full bg-muted rounded-md animate-pulse mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-1/4 bg-muted/80 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export function LeaderboardTable() {
  const [currentTab, setCurrentTab] = useState("weekly");
  const { user } = useAuth();
  const { toast } = useToast();
  
  interface LeaderboardsResponse {
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    global: LeaderboardEntry[];
  }

  const { data: leaderboards, isLoading, isError } = useQuery<LeaderboardsResponse>({
    queryKey: ['/api/leaderboards'],
    retry: 2,
    onSuccess: (data) => {
      console.log("Leaderboards loaded successfully");
    },
    onError: () => {
      console.error("Error fetching leaderboards");
      toast({
        title: "Error loading leaderboards",
        description: "Could not load the leaderboards. Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (isError || !leaderboards) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-primary" />
            <span>Leaderboards</span>
          </CardTitle>
          <CardDescription>
            See how you rank against other players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <TrophyIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Could not load leaderboards. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find user's current rank
  const getUserRank = (entries: LeaderboardEntry[]) => {
    const userEntry = entries.find((entry) => entry.userId === user?.id);
    return userEntry?.rank || "N/A";
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary" />
          <span>Leaderboards</span>
        </CardTitle>
        <CardDescription>
          See how you rank against other players
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="global">All Time</TabsTrigger>
          </TabsList>
          
          {Object.entries({
            weekly: leaderboards.weekly || [],
            monthly: leaderboards.monthly || [],
            global: leaderboards.global || [],
          }).map(([key, entries]) => (
            <TabsContent key={key} value={key} className="mt-0">
              {entries.length > 0 ? (
                <>
                  <div className="bg-muted/40 rounded-md p-3 mb-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Your Rank</p>
                      <p className="text-2xl font-bold">{getUserRank(entries)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Your Points</p>
                      <p className="text-2xl font-bold">
                        {entries.find((e) => e.userId === user?.id)?.points || 0}
                      </p>
                    </div>
                    {key === "weekly" && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Resets</p>
                        <p className="text-sm">Mondays at 00:00</p>
                      </div>
                    )}
                    {key === "monthly" && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Resets</p>
                        <p className="text-sm">1st of month</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries
                          .sort((a, b) => a.rank - b.rank)
                          .slice(0, 10)
                          .map((entry) => (
                            <LeaderboardRow 
                              key={entry.id} 
                              entry={entry} 
                              rank={entry.rank}
                              currentUserId={user?.id || 0} 
                            />
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {!entries.some(e => e.userId === user?.id) && (
                    <div className="mt-3 p-2 border rounded text-sm flex items-center gap-2 bg-muted/20">
                      <SparkleIcon className="h-4 w-4 text-primary" />
                      <span>Earn points to appear on the leaderboard!</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 border rounded-md bg-muted/30">
                  <SparkleIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium mb-1">No data available</p>
                  <p className="text-sm text-muted-foreground">
                    Start making predictions to earn points!
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default LeaderboardTable;