import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trophy, Award, Medal, Target, User, Flame, ArrowUpRightFromCircle } from "lucide-react";
import { BadgesGrid } from '@/components/gamification/badges-grid';
import { LeaderboardTable } from '@/components/gamification/leaderboard-table';
import { useToast } from '@/hooks/use-toast';

// Mock badge data (to be replaced with API data)
const MOCK_BADGES = [
  {
    id: 1,
    name: "First Prediction",
    description: "Make your first prediction",
    category: "predictions",
    icon: "target",
    achieved: true,
    achievedDate: new Date(2025, 2, 15),
    tier: "bronze"
  },
  {
    id: 2,
    name: "Streak Master",
    description: "Maintain a login streak of 7 days",
    category: "activity",
    icon: "flame",
    achieved: true,
    achievedDate: new Date(2025, 3, 10),
    tier: "silver"
  },
  {
    id: 3,
    name: "Prediction Pro",
    description: "Get 5 correct predictions in a row",
    category: "predictions",
    icon: "award",
    achieved: false,
    progress: 3,
    maxProgress: 5,
    tier: "gold"
  },
  {
    id: 4,
    name: "Fantasy Captain",
    description: "Create a fantasy team",
    category: "fantasy",
    icon: "shield",
    achieved: true,
    achievedDate: new Date(2025, 2, 18),
    tier: "bronze"
  },
  {
    id: 5,
    name: "Community Leader",
    description: "Refer 5 friends to join",
    category: "referrals",
    icon: "medal",
    achieved: false,
    progress: 2,
    maxProgress: 5,
    tier: "platinum"
  },
  {
    id: 6,
    name: "Accumulator King",
    description: "Win a 5+ match accumulator",
    category: "predictions",
    icon: "trophy",
    achieved: false,
    tier: "platinum"
  },
  {
    id: 7,
    name: "Fantasy Champion",
    description: "Win a premium fantasy contest",
    category: "fantasy",
    icon: "trophy",
    achieved: false,
    tier: "gold"
  },
  {
    id: 8,
    name: "Early Adopter",
    description: "Join during the platform's first month",
    category: "activity",
    icon: "star",
    achieved: true,
    achievedDate: new Date(2025, 1, 5),
    tier: "silver"
  }
];

// Mock leaderboard data (to be replaced with API data)
const MOCK_LEADERBOARD = [
  {
    id: 1,
    rank: 1,
    userId: 101,
    username: "PredictionKing",
    avatarUrl: null,
    points: 9850,
    contestsEntered: 23,
    contestsWon: 7,
    winRate: 0.304,
    streakCount: 5,
    rankChange: 0,
    tier: "Elite"
  },
  {
    id: 2,
    rank: 2,
    userId: 234,
    username: "SportsGenius",
    avatarUrl: null,
    points: 8720,
    contestsEntered: 19,
    contestsWon: 5,
    winRate: 0.263,
    streakCount: 3,
    rankChange: 2,
    tier: "Pro"
  },
  {
    id: 3,
    rank: 3,
    userId: 187,
    username: "GoalMachine",
    avatarUrl: null,
    points: 7640,
    contestsEntered: 15,
    contestsWon: 4,
    winRate: 0.267,
    streakCount: 4,
    rankChange: -1,
    tier: "Pro"
  },
  {
    id: 4,
    rank: 4,
    userId: 312,
    username: "BettingPro",
    avatarUrl: null,
    points: 6580,
    contestsEntered: 20,
    contestsWon: 3,
    winRate: 0.15,
    streakCount: 1,
    rankChange: 3,
    tier: "Pro"
  },
  {
    id: 5,
    rank: 5,
    userId: 145,
    username: "PuntaChamp",
    avatarUrl: null,
    points: 5940,
    contestsEntered: 12,
    contestsWon: 2,
    winRate: 0.167,
    streakCount: 2,
    rankChange: -2,
    tier: "Basic"
  }
];

// User stats summary
interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  longestStreak: number;
  currentStreak: number;
  badgesEarned: number;
  totalBadges: number;
  points: number;
  rank: number;
  contestsWon: number;
}

export default function GamificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('achievements');
  const [badgeCategory, setBadgeCategory] = useState<string>('all');
  const [leaderboardType, setLeaderboardType] = useState<string>('global');
  
  // Fetch user badges
  const { data: badges, isLoading: isBadgesLoading } = useQuery({
    queryKey: ['/api/badges'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/badges');
        if (!res.ok) throw new Error('Failed to fetch badges');
        return await res.json();
      } catch (error) {
        // If API fails, use mock data for demo
        console.warn('Using mock badge data due to API error');
        return MOCK_BADGES;
      }
    }
  });
  
  // Fetch leaderboard data
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard', leaderboardType],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/leaderboard?type=${leaderboardType}`);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return await res.json();
      } catch (error) {
        // If API fails, use mock data for demo
        console.warn('Using mock leaderboard data due to API error');
        return MOCK_LEADERBOARD;
      }
    },
    enabled: activeTab === 'leaderboard'
  });
  
  // Mock user stats for demonstration
  const userStats: UserStats = {
    totalPredictions: 67,
    correctPredictions: 42,
    accuracy: 0.627,
    longestStreak: 8,
    currentStreak: 3,
    badgesEarned: badges?.filter((b: any) => b.achieved).length || 3,
    totalBadges: badges?.length || 8,
    points: 2340,
    rank: 17,
    contestsWon: 1
  };
  
  // Filter badges by category
  const filteredBadges = badges?.filter((badge: any) => 
    badgeCategory === 'all' || badge.category === badgeCategory
  );
  
  // Find user in leaderboard
  const userInLeaderboard = leaderboard?.find((entry: any) => user && entry.userId === user.id);
  
  // Helper to get stat icon
  const getStatIcon = (type: string) => {
    switch (type) {
      case 'accuracy':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'streak':
        return <Flame className="h-5 w-5 text-orange-500" />;
      case 'rank':
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'badges':
        return <Award className="h-5 w-5 text-blue-500" />;
      default:
        return <Medal className="h-5 w-5 text-purple-500" />;
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Achievements & Leaderboard</h1>
          <p className="text-muted-foreground">Track your progress and compete with other players</p>
        </div>
        
        {user && (
          <Card className="w-full md:w-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">Rank #{userStats.rank}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-sm font-medium">{userStats.points.toLocaleString()} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prediction Accuracy</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{(userStats.accuracy * 100).toFixed(0)}%</CardTitle>
              {getStatIcon('accuracy')}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{userStats.correctPredictions} of {userStats.totalPredictions} correct</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{userStats.currentStreak} days</CardTitle>
              {getStatIcon('streak')}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Longest streak: {userStats.longestStreak} days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Badges Earned</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{userStats.badgesEarned}</CardTitle>
              {getStatIcon('badges')}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{userStats.badgesEarned} of {userStats.totalBadges} badges</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contests Won</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{userStats.contestsWon}</CardTitle>
              {getStatIcon('contests')}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Fantasy football contests</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'achievements' && (
            <Select value={badgeCategory} onValueChange={setBadgeCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="predictions">Predictions</SelectItem>
                <SelectItem value="fantasy">Fantasy Football</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="referrals">Referrals</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {activeTab === 'leaderboard' && (
            <Select value={leaderboardType} onValueChange={setLeaderboardType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Leaderboard Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <TabsContent value="achievements" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>
                Complete predictions and activities to earn badges and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgesGrid 
                badges={filteredBadges || []} 
                isLoading={isBadgesLoading}
                filterCategory={badgeCategory !== 'all' ? badgeCategory : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Player Rankings</CardTitle>
              <CardDescription>
                Compete with other players to climb the ranks and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable 
                entries={leaderboard || []}
                isLoading={isLeaderboardLoading}
                highlightUserId={user?.id}
                showStreaks={true}
                showRankChanges={true}
                showContests={leaderboardType === 'global'}
                type={leaderboardType as 'global' | 'weekly' | 'monthly'}
              />
              
              {user && !userInLeaderboard && !isLeaderboardLoading && leaderboard?.length > 0 && (
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Your Rank: #{userStats.rank}</p>
                      <p className="text-sm text-muted-foreground">{userStats.points.toLocaleString()} points</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                      toast({
                        title: "Keep making predictions!",
                        description: "Make more accurate predictions to climb the leaderboard"
                      });
                    }}>
                      <span>Improve Rank</span>
                      <ArrowUpRightFromCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}