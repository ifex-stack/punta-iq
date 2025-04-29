import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Medal, Trophy, Star, Award, ChevronUp, ChevronDown, Minus, Flame } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  id: number;
  rank: number;
  userId: number;
  username: string;
  avatarUrl?: string;
  points: number;
  contestsEntered?: number;
  contestsWon?: number;
  winRate?: number;
  streakCount?: number;
  rankChange?: number; // positive for up, negative for down, 0 for no change
  tier?: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  highlightUserId?: number;
  showStreaks?: boolean;
  showRankChanges?: boolean;
  showContests?: boolean;
  type?: 'global' | 'weekly' | 'monthly' | 'contest';
  limit?: number;
}

export function LeaderboardTable({ 
  entries, 
  isLoading = false,
  highlightUserId,
  showStreaks = false,
  showRankChanges = false,
  showContests = false,
  type = 'global',
  limit = 10
}: LeaderboardTableProps) {
  const topEntries = entries.slice(0, limit);
  
  // Helper function to render rank icon for top positions
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    if (rank <= 10) return <Star className="h-5 w-5 text-blue-400" />;
    return null;
  };
  
  // Helper function to render rank change indicator
  const getRankChangeIndicator = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <ChevronUp className="h-4 w-4 text-green-500" />;
    return <ChevronDown className="h-4 w-4 text-red-500" />;
  };
  
  // Helper function to get description for leaderboard type
  const getLeaderboardTitle = () => {
    switch (type) {
      case 'weekly':
        return 'Weekly Leaderboard';
      case 'monthly':
        return 'Monthly Leaderboard';
      case 'contest':
        return 'Contest Leaderboard';
      default:
        return 'Global Leaderboard';
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">{getLeaderboardTitle()}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Points</TableHead>
                {showContests && (
                  <>
                    <TableHead className="text-right">Contests</TableHead>
                    <TableHead className="text-right">Wins</TableHead>
                  </>
                )}
                {showStreaks && (
                  <TableHead className="text-right">Streak</TableHead>
                )}
                {showRankChanges && (
                  <TableHead className="text-right w-12">Change</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  {showContests && (
                    <>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-10 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-10 ml-auto" />
                      </TableCell>
                    </>
                  )}
                  {showStreaks && (
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-10 ml-auto" />
                    </TableCell>
                  )}
                  {showRankChanges && (
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-4 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Show empty state
  if (!entries.length) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">{getLeaderboardTitle()}</h3>
        <div className="rounded-md border p-8 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
          <h4 className="font-medium">No Leaderboard Data</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {type === 'contest' 
              ? 'No one has entered this contest yet.' 
              : 'Leaderboard data will appear once users start playing.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{getLeaderboardTitle()}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Points</TableHead>
              {showContests && (
                <>
                  <TableHead className="text-right">Contests</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                </>
              )}
              {showStreaks && (
                <TableHead className="text-right">Streak</TableHead>
              )}
              {showRankChanges && (
                <TableHead className="text-right w-12">Change</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEntries.map((entry) => (
              <TableRow 
                key={entry.id}
                className={highlightUserId === entry.userId ? 'bg-muted/50' : ''}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>{entry.rank}</span>
                    {getRankIcon(entry.rank)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                      <AvatarFallback>
                        {entry.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.username}</div>
                      {entry.tier && (
                        <Badge variant="outline" className="text-xs">
                          {entry.tier}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{entry.points.toLocaleString()}</TableCell>
                {showContests && (
                  <>
                    <TableCell className="text-right">{entry.contestsEntered || 0}</TableCell>
                    <TableCell className="text-right">
                      {entry.contestsWon || 0}
                      {entry.winRate !== undefined && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({(entry.winRate * 100).toFixed(0)}%)
                        </span>
                      )}
                    </TableCell>
                  </>
                )}
                {showStreaks && (
                  <TableCell className="text-right">
                    {entry.streakCount ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>{entry.streakCount}</span>
                        {entry.streakCount >= 3 && <Flame className="h-4 w-4 text-orange-500" />}
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                )}
                {showRankChanges && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getRankChangeIndicator(entry.rankChange)}
                      {entry.rankChange !== 0 && (
                        <span className={entry.rankChange && entry.rankChange > 0 ? 'text-green-500' : (entry.rankChange && entry.rankChange < 0 ? 'text-red-500' : '')}>
                          {entry.rankChange ? Math.abs(entry.rankChange) : '-'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}