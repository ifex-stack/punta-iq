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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowDown, ArrowUp, Minus, Trophy, Users } from "lucide-react";

interface LeaderboardEntry {
  id: number;
  leaderboardId: number;
  userId: number;
  username?: string;
  points: number;
  rank: number;
  previousRank?: number;
  details?: any;
  lastUpdated: string;
}

interface Leaderboard {
  id: number;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'seasonal' | 'all_time' | 'fantasy' | 'prediction_accuracy';
  period?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  entries?: LeaderboardEntry[];
}

interface LeaderboardTableProps {
  leaderboard: Leaderboard | null;
  userId?: number;
  limit?: number;
}

export default function LeaderboardTable({ leaderboard, userId, limit = 100 }: LeaderboardTableProps) {
  if (!leaderboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>No leaderboard data available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get entries from the leaderboard or use an empty array if none exist
  const entries = (leaderboard.entries || []).slice(0, limit);
  
  // Filter entries if needed (can be used to show only top 10, etc.)
  const filteredEntries = entries;
  
  // Find the current user's entry and rank
  const userEntry = entries.find((entry: LeaderboardEntry) => entry.userId === userId);
  const userRank = userEntry ? userEntry.rank : null;

  // Format date range for display
  const formatDateRange = () => {
    const start = new Date(leaderboard.startDate);
    const end = new Date(leaderboard.endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  // Helper to render rank change indicator
  const renderRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return null;
    
    const diff = entry.previousRank - entry.rank;
    
    if (diff > 0) {
      return (
        <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">
          <ArrowUp className="h-3 w-3 mr-1" />
          {diff}
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge variant="outline" className="ml-2 text-red-600 border-red-200 bg-red-50">
          <ArrowDown className="h-3 w-3 mr-1" />
          {Math.abs(diff)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="ml-2 text-gray-600 border-gray-200 bg-gray-50">
          <Minus className="h-3 w-3" />
        </Badge>
      );
    }
  };

  // Get the icon based on leaderboard type
  const getLeaderboardIcon = () => {
    switch (leaderboard.type) {
      case 'fantasy':
        return <Users className="h-5 w-5 text-indigo-500" />;
      default:
        return <Trophy className="h-5 w-5 text-amber-500" />;
    }
  };

  // Get user initials for avatar
  const getUserInitials = (username: string = '') => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{leaderboard.name}</CardTitle>
          <CardDescription className="mt-1">
            {leaderboard.description}<br />
            <span className="text-xs font-medium">Period: {formatDateRange()}</span>
          </CardDescription>
        </div>
        <div>
          {getLeaderboardIcon()}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No entries found for this leaderboard. Be the first to compete!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry: LeaderboardEntry) => (
                <TableRow 
                  key={entry.id}
                  className={entry.userId === userId ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">
                    {entry.rank}
                    {renderRankChange(entry)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className={
                          entry.rank === 1 ? "bg-amber-100 text-amber-800" :
                          entry.rank === 2 ? "bg-slate-100 text-slate-800" :
                          entry.rank === 3 ? "bg-amber-50 text-amber-700" :
                          "bg-muted"
                        }>
                          {getUserInitials(entry.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={entry.userId === userId ? "font-medium" : ""}>
                        {entry.username} {entry.userId === userId && <span className="text-xs text-muted-foreground">(You)</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {entry.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Show user's rank if not in the displayed entries */}
        {userId && userEntry && !filteredEntries.some(entry => entry.userId === userId) && (
          <div className="mt-4 pt-4 border-t">
            <Table>
              <TableBody>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">
                    {userEntry.rank}
                    {renderRankChange(userEntry)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {getUserInitials(userEntry.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {userEntry.username} <span className="text-xs text-muted-foreground">(You)</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {userEntry.points}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}