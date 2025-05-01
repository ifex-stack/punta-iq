import { useState, useEffect } from "react";
import { ReferralCard } from "@/components/referrals/referral-card";
import { ReferralTiers } from "@/components/referrals/referral-tiers";
import { ReferralHistory } from "@/components/referrals/referral-history";
import { ReferralBadge } from "@/components/referrals/referral-badge";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { ReferralStreak } from "@/components/referrals/referral-streak";
import { ReferralShare } from "@/components/referrals/referral-share";
import { ReferralQRCode } from "@/components/referrals/referral-qr-code";
import { ReferralStatusTracker } from "@/components/referrals/referral-status-tracker";
import { ReferralAnalytics } from "@/components/referrals/referral-analytics";
import { PageHeader } from "@/components/layout/page-header";
import { Gift, ScrollText, Share, ChartBar, Trophy, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useFeatureFlag } from "@/lib/feature-flags";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isReferralEnabled = useFeatureFlag('referralProgram');
  
  // Get referral data
  const { data: referralStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/referrals/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals/stats');
      return res.json();
    },
    enabled: !!user && isReferralEnabled
  });
  
  // Get user's referrals
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['/api/referrals'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals');
      return res.json();
    },
    enabled: !!user && isReferralEnabled
  });
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (!isReferralEnabled) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container py-8 max-w-5xl">
      <PageHeader
        title="Referral Program"
        description="Invite friends and earn points when they join"
        icon={<Gift className="text-primary h-6 w-6" />}
      />
      
      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Invites" 
          value={isLoadingStats ? null : referralStats?.totalReferrals || 0}
          icon={<Users className="h-5 w-5 text-blue-400" />} 
        />
        <StatCard 
          title="Successful" 
          value={isLoadingStats ? null : referralStats?.completedReferrals || 0}
          icon={<Trophy className="h-5 w-5 text-green-500" />} 
        />
        <StatCard 
          title="Pending" 
          value={isLoadingStats ? null : referralStats?.pendingReferrals || 0}
          icon={<Gift className="h-5 w-5 text-yellow-500" />} 
        />
        <StatCard 
          title="Points Earned" 
          value={isLoadingStats ? null : referralStats?.totalRewards || 0}
          icon={<ChartBar className="h-5 w-5 text-purple-500" />} 
        />
      </div>
      
      <Tabs defaultValue="program" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="program">
            <Gift className="h-4 w-4 mr-2" />
            Program
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="history">
            <Users className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="program" className="mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <ReferralCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Referral Rewards
                </CardTitle>
                <CardDescription>
                  Earn points and unlock special perks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">What you get:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>500 points for each friend who joins</li>
                    <li>Points can be used for premium predictions</li>
                    <li>Exclusive badges for reaching referral milestones</li>
                    <li>Special position on the referral leaderboard</li>
                    <li>Free premium access when reaching tier thresholds</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">What your friends get:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>200 welcome points when they sign up</li>
                    <li>Access to one week of premium predictions</li>
                    <li>Entry into the newcomers fantasy contest</li>
                    <li>Personalized onboarding experience</li>
                  </ul>
                </div>
                
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Special Campaign: April Boost
                  </h3>
                  <p className="text-sm">
                    For a limited time, earn <span className="font-semibold text-primary">DOUBLE POINTS</span> for every successful referral! Campaign ends May 1st.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>How the Referral Program Works</CardTitle>
                <CardDescription>
                  Follow these simple steps to refer friends and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                    <h3 className="font-medium">Share Your Code</h3>
                    <p className="text-sm text-muted-foreground">Copy your unique referral code and share it with friends or use the share button</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                    <h3 className="font-medium">Friend Registers</h3>
                    <p className="text-sm text-muted-foreground">Your friend creates an account using your referral code during registration</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                    <h3 className="font-medium">Earn Rewards</h3>
                    <p className="text-sm text-muted-foreground">Once they complete their profile, both of you receive points and rewards</p>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium">Important Notes:</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Your friend must use your referral code during registration</li>
                    <li>Points are awarded only after the referred user completes their profile</li>
                    <li>Each user can only be referred once</li>
                    <li>We monitor for fraudulent activity - multiple accounts created from the same device are not eligible for rewards</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tiers" className="mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <ReferralStreak />
            <ReferralBadge />
            <ReferralTiers userId={user.id} className="md:col-span-2" />
            <ReferralLeaderboard limit={5} className="md:col-span-2" />
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          {isLoadingReferrals ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <ReferralHistory referrals={referrals || []} />
          )}
        </TabsContent>
        
        <TabsContent value="share" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReferralShare className="md:col-span-2" />
            
            {/* Add the new QR Code component */}
            <ReferralQRCode 
              referralCode={referralStats?.referralCode || "PUNTA123"}
              shareUrl={`https://puntaiq.com/join?ref=${referralStats?.referralCode || "PUNTA123"}`}
            />
            
            {/* Add the new Status Tracker component */}
            <ReferralStatusTracker 
              referrals={referrals || []}
            />
            
            {/* Add the new Analytics component */}
            <ReferralAnalytics 
              userId={user.id}
              className="md:col-span-2"
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Referral Contest
                </CardTitle>
                <CardDescription>
                  Compete with other users for rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-card p-4 text-center">
                  <h3 className="text-lg font-bold">Spring Referral Competition</h3>
                  <p className="text-sm text-muted-foreground mt-1">April 1 - May 31, 2025</p>
                  <div className="mt-4 mb-2">
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                      3 more days
                    </span>
                    <p className="text-xs text-muted-foreground">until competition ends</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium">Prizes:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      <span className="font-semibold">1st Place:</span> 
                      <span className="ml-2">Free 1-year Elite subscription</span>
                    </li>
                    <li>
                      <span className="font-semibold">2nd Place:</span> 
                      <span className="ml-2">Free 6-month Pro subscription</span>
                    </li>
                    <li>
                      <span className="font-semibold">3rd Place:</span> 
                      <span className="ml-2">Free 3-month Pro subscription</span>
                    </li>
                    <li>
                      <span className="font-semibold">Top 10:</span> 
                      <span className="ml-2">5,000 bonus points</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Your Position:</h3>
                  <div className="p-3 border rounded-lg flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold">
                        5
                      </div>
                      <div>
                        <p className="font-medium">Your Rank</p>
                        <p className="text-xs text-muted-foreground">2 referrals away from 3rd place</p>
                      </div>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-800/60 py-1 px-3 rounded-md text-amber-800 dark:text-amber-200 text-sm font-medium">
                      Prize Eligible
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat card component
const StatCard = ({ title, value, icon }: { title: string, value: number | null, icon: React.ReactNode }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {value === null ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <h3 className="text-2xl font-bold">{value}</h3>
            )}
          </div>
          <div className="p-2 bg-background rounded-md">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};