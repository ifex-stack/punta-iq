import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, ArrowDownRight, Minus, Search, Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  leaderboard: any | null;
  userId?: number;
  limit?: number;
}

export default function LeaderboardTable({ leaderboard, userId, limit = 100 }: LeaderboardTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch leaderboard entries if we have a leaderboard ID
  const {
    data: leaderboardWithEntries,
    isLoading,
  } = useQuery({
    queryKey: ["/api/leaderboards", leaderboard?.id],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboards/${leaderboard.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard entries");
      }
      return response.json();
    },
    enabled: !!leaderboard?.id,
  });

  // Handle the case where no leaderboard is provided
  if (!leaderboard && !isLoading) {
    return (
      <div className="text-center py-10">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No active leaderboard</h3>
        <p className="text-muted-foreground">
          Check back later for new leaderboard competitions.
        </p>
      </div>
    );
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const entries = leaderboardWithEntries?.entries || [];
  
  // Filter entries by search term
  const filteredEntries = entries.filter((entry: any) => 
    search === "" || 
    entry.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Paginate entries
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  // Find current user's entry
  const userEntry = entries.find((entry: any) => entry.userId === userId);
  const userRank = userEntry ? entries.findIndex((entry: any) => entry.userId === userId) + 1 : null;

  // Determine if user entry should be shown separately (if not on current page)
  const showUserSeparately = userEntry && 
    (userRank < startIndex + 1 || userRank > endIndex);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">
            {leaderboard.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(leaderboard.startDate).toLocaleDateString()} - {new Date(leaderboard.endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="w-full md:w-64">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left font-medium p-3 w-16">Rank</th>
              <th className="text-left font-medium p-3">User</th>
              <th className="text-left font-medium p-3 hidden md:table-cell">Change</th>
              <th className="text-right font-medium p-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.length > 0 ? (
              <>
                {paginatedEntries.map((entry: any, idx: number) => {
                  const actualRank = startIndex + idx + 1;
                  const rankChange = entry.previousRank 
                    ? entry.previousRank - actualRank 
                    : 0;
                  
                  return (
                    <tr 
                      key={entry.userId} 
                      className={cn(
                        "border-b",
                        entry.userId === userId ? "bg-muted/50" : ""
                      )}
                    >
                      <td className="p-3">
                        {actualRank <= 3 ? (
                          <div className="flex items-center">
                            <Medal className={cn(
                              "h-5 w-5 mr-1.5",
                              actualRank === 1 ? "text-yellow-500" : 
                              actualRank === 2 ? "text-gray-400" :
                              "text-amber-600"
                            )} />
                            <span>{actualRank}</span>
                          </div>
                        ) : (
                          <span>{actualRank}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {entry.username || `User ${entry.userId}`}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {rankChange > 0 ? (
                          <span className="flex items-center text-green-600">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            {rankChange}
                          </span>
                        ) : rankChange < 0 ? (
                          <span className="flex items-center text-red-600">
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            {Math.abs(rankChange)}
                          </span>
                        ) : (
                          <span className="flex items-center text-muted-foreground">
                            <Minus className="h-4 w-4 mr-1" />
                            0
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {entry.points}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Show user entry separately if not on current page */}
                {showUserSeparately && (
                  <>
                    <tr className="border-b border-t border-dashed">
                      <td colSpan={4} className="p-1 text-center text-xs text-muted-foreground">
                        &bull; &bull; &bull;
                      </td>
                    </tr>
                    <tr 
                      className="border-b bg-muted/50"
                    >
                      <td className="p-3">
                        {userRank}
                      </td>
                      <td className="p-3 font-medium">
                        {userEntry.username || `User ${userEntry.userId}`}
                        <Badge variant="outline" className="ml-2">You</Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {userEntry.previousRank && userEntry.previousRank !== userRank ? (
                          userEntry.previousRank > userRank ? (
                            <span className="flex items-center text-green-600">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              {userEntry.previousRank - userRank}
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                              {userRank - userEntry.previousRank}
                            </span>
                          )
                        ) : (
                          <span className="flex items-center text-muted-foreground">
                            <Minus className="h-4 w-4 mr-1" />
                            0
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {userEntry.points}
                      </td>
                    </tr>
                  </>
                )}
              </>
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}