import { FC } from "react";
import { Leaderboard, LeaderboardEntry } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardCardProps {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
  currentUserId?: number;
}

export const LeaderboardCard: FC<LeaderboardCardProps> = ({ 
  leaderboard, 
  entries,
  currentUserId
}) => {
  // Sort entries by score in descending order
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
  
  // Limit to top 10 entries for display
  const topEntries = sortedEntries.slice(0, 10);
  
  // Find current user's rank
  const userRank = sortedEntries.findIndex(entry => entry.userId === currentUserId) + 1;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{leaderboard.name}</CardTitle>
          <span className="text-xs text-muted-foreground">
            Updated: {new Date(leaderboard.updatedAt).toLocaleDateString()}
          </span>
        </div>
        <CardDescription>{leaderboard.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {currentUserId && userRank > 0 && (
          <div className="p-3 mb-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Your Ranking</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">#{userRank}</span>
                <span className="text-sm">out of {sortedEntries.length} players</span>
              </div>
              <span className="font-semibold">
                {sortedEntries[userRank - 1]?.score || 0} points
              </span>
            </div>
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEntries.length > 0 ? (
              topEntries.map((entry, index) => (
                <TableRow 
                  key={entry.id}
                  className={entry.userId === currentUserId ? "bg-accent/30" : ""}
                >
                  <TableCell className="font-medium">
                    {index === 0 ? (
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-4 h-4 text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="w-4 h-4 text-amber-600" />
                    ) : (
                      `#${index + 1}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {`U${entry.userId}`}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">User {entry.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{entry.score}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};