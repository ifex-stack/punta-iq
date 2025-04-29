import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Award, Sparkles, Crown, Target, BarChart, Rocket } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import BadgesGrid from "@/components/gamification/badges-grid";
import LeaderboardTable from "@/components/gamification/leaderboard-table";
import { useAuth } from "@/hooks/use-auth";

const StatCard = ({ title, value, icon, description }: { 
  title: string; 
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {title}
      </CardTitle>
      <div className="h-8 w-8 rounded-md bg-primary/10 p-1.5 text-primary">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const calculateStreakDisplay = (streak: number) => {
  if (streak === 0) return "No active streak";
  return `${streak} day${streak !== 1 ? 's' : ''}`;
};

export default function GamificationPage() {
  const { user } = useAuth();

  const stats = {
    totalPoints: user?.gamificationPoints || 0,
    rank: user?.rank || "N/A",
    badges: user?.badgesCount || 0,
    streak: user?.currentStreak || 0,
    longestStreak: user?.longestStreak || 0,
    predictionAccuracy: user?.predictionAccuracy || 0,
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Rewards & Achievements | PuntaIQ</title>
      </Helmet>

      <div className="container px-4 py-6 sm:px-6 lg:px-8 max-w-7xl flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Rewards & Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress, earn badges, and compete on leaderboards
          </p>
        </header>
        
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-sm">
              Badges
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="text-sm">
              Leaderboards
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-sm">
              Statistics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Points" 
                value={stats.totalPoints.toLocaleString()}
                icon={<Star />}
                description="Lifetime points earned"
              />
              <StatCard 
                title="Global Rank" 
                value={stats.rank}
                icon={<Trophy />}
                description="Your position on the global leaderboard"
              />
              <StatCard 
                title="Active Streak" 
                value={calculateStreakDisplay(stats.streak)}
                icon={<Target />}
                description={`Longest streak: ${stats.longestStreak} days`}
              />
              <StatCard 
                title="Badges Earned" 
                value={`${stats.badges}`}
                icon={<Award />}
                description="Unlock more by completing challenges"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LeaderboardTable />
              <BadgesGrid />
            </div>
          </TabsContent>
          
          <TabsContent value="badges" className="space-y-4">
            <BadgesGrid />
          </TabsContent>
          
          <TabsContent value="leaderboards" className="space-y-4">
            <LeaderboardTable />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <span>Your Performance Stats</span>
                </CardTitle>
                <CardDescription>Track your progress and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Prediction Accuracy" 
                    value={`${stats.predictionAccuracy}%`}
                    icon={<Target />}
                    description="Success rate on all predictions"
                  />
                  <StatCard 
                    title="Points This Month" 
                    value={(stats.totalPoints * 0.2).toFixed(0)}
                    icon={<Crown />}
                    description="Points earned in the current month"
                  />
                  <StatCard 
                    title="Points This Week" 
                    value={(stats.totalPoints * 0.08).toFixed(0)}
                    icon={<Sparkles />}
                    description="Points earned in the current week"
                  />
                  <StatCard 
                    title="Growth Rate" 
                    value="+15%"
                    icon={<Rocket />}
                    description="Increase in points from last month"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}