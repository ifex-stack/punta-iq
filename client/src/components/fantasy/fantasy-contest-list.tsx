import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, Users, Trophy } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface FantasyContest {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  entryFee: number | null;
  prizePool: any;
  maxTeams: number | null;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  tier: 'free' | 'premium';
  type: string;
  playerCount: number;
  requiresPremium?: boolean;
}

interface FantasyContestListProps {
  tier?: 'free' | 'premium';
  status?: string;
  limit?: number;
  showUpgradePrompt?: boolean;
}

export default function FantasyContestList({ tier, status = 'upcoming', limit = 6, showUpgradePrompt = true }: FantasyContestListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremiumUser = user?.subscriptionTier === 'premium';
  
  // Construct the API endpoint based on tier
  const endpoint = tier 
    ? `/api/fantasy/contests/${tier}`
    : `/api/fantasy/contests?status=${status}${tier ? `&tier=${tier}` : ''}`;
  
  const { data: contests, isLoading, error } = useQuery<FantasyContest[]>({
    queryKey: [endpoint],
    enabled: true,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardHeader className="h-20 bg-gray-100"></CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Error loading contests: {error.message}</div>;
  }
  
  if (!contests || contests.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <Trophy className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No Contests Available</CardTitle>
          <CardDescription>
            There are no {tier} fantasy contests available at the moment. 
            Please check back later for new contests.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.slice(0, limit).map((contest) => (
          <Card 
            key={contest.id} 
            className={`overflow-hidden transition-all duration-200 hover:shadow-md 
              ${contest.tier === 'premium' ? 'border-amber-400/50 bg-gradient-to-br from-white to-amber-50' : ''}
            `}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-1">{contest.name}</CardTitle>
                {contest.tier === 'premium' && (
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                    <Crown className="h-3 w-3 mr-1" /> Premium
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {contest.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-4 space-y-4">
              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <div>
                    <span className="font-medium">
                      Starts {formatDistance(new Date(contest.startDate), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>
                    {contest.playerCount || 0} participants
                    {contest.maxTeams && ` / ${contest.maxTeams} max`}
                  </span>
                </div>
                {contest.prizePool && (
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>
                      {typeof contest.prizePool === 'object' ? 
                        `Prize pool: £${contest.prizePool.total || 100}` :
                        'Prize pool available'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              {contest.requiresPremium && !isPremiumUser ? (
                <Button 
                  variant="outline" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white hover:text-white"
                  onClick={() => {
                    if (showUpgradePrompt) {
                      toast({
                        title: "Premium Contest",
                        description: "Upgrade your account to participate in premium contests with cash prizes!",
                        variant: "default",
                        action: (
                          <Button asChild variant="default" size="sm">
                            <Link to="/subscription">Upgrade</Link>
                          </Button>
                        ),
                      });
                    }
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" /> Upgrade to Join
                </Button>
              ) : (
                <Button asChild variant="default" className="w-full">
                  <Link to={`/fantasy/contests/${contest.id}`}>View Contest</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {contests.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to={`/fantasy/contests${tier ? `?tier=${tier}` : ''}`}>
              View All Contests
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}