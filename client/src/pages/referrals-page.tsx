import { useState, useEffect } from "react";
import { ReferralCard } from "@/components/referrals/referral-card";
import { ReferralTiers } from "@/components/referrals/referral-tiers";
import { ReferralHistory } from "@/components/referrals/referral-history";
import { ReferralBadge } from "@/components/referrals/referral-badge";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { ReferralStreak } from "@/components/referrals/referral-streak";
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
            <ReferralBadge />
            <ReferralTiers userId={user.id} />
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
          <Card>
            <CardHeader>
              <CardTitle>Share Your Referral Link</CardTitle>
              <CardDescription>
                Choose how you want to share your referral code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col py-6 gap-2" onClick={() => {
                  navigator.share({
                    title: 'Join PuntaIQ',
                    text: 'Use my referral code to sign up for PuntaIQ and get bonus points!',
                    url: window.location.origin
                  }).catch(() => {
                    // Fallback if Web Share API is not supported
                    toast({
                      title: "Sharing not supported",
                      description: "Your browser doesn't support sharing. Try another method.",
                      variant: "destructive"
                    });
                  });
                }}>
                  <Share className="h-6 w-6 mb-2" />
                  <span>Share</span>
                  <span className="text-xs text-muted-foreground">Any App</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col py-6 gap-2" onClick={() => {
                  window.open(`https://wa.me/?text=Join PuntaIQ using my referral code! ${window.location.origin}`);
                }}>
                  <svg className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>WhatsApp</span>
                  <span className="text-xs text-muted-foreground">Send Message</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col py-6 gap-2" onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=Join PuntaIQ using my referral code! ${window.location.origin}`);
                }}>
                  <svg className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  <span>Twitter</span>
                  <span className="text-xs text-muted-foreground">Post Tweet</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col py-6 gap-2" onClick={() => {
                  window.open(`mailto:?subject=Join PuntaIQ&body=Use my referral code to sign up for PuntaIQ and get bonus points! ${window.location.origin}`);
                }}>
                  <svg className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Email</span>
                  <span className="text-xs text-muted-foreground">Send Email</span>
                </Button>
              </div>
              
              {/* QR Code Section */}
              <div className="mt-8 p-6 border rounded-xl bg-card/50">
                <h3 className="text-lg font-medium mb-4 text-center">Share via QR Code</h3>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                    <svg className="w-full h-full text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                      <rect x="60" y="10" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="60" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                      <rect x="60" y="60" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                      <rect x="20" y="20" width="10" height="10" fill="currentColor" />
                      <rect x="70" y="20" width="10" height="10" fill="currentColor" />
                      <rect x="20" y="70" width="10" height="10" fill="currentColor" />
                      <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="45" y="15" width="10" height="10" fill="currentColor" />
                      <rect x="45" y="75" width="10" height="10" fill="currentColor" />
                      <rect x="75" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="15" y="45" width="10" height="10" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">Scan this QR code to join PuntaIQ</p>
                  <Button className="mt-2" size="sm">
                    Download QR Code
                  </Button>
                </div>
              </div>
              
              {/* Pre-formatted Messages */}
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Pre-formatted Messages:</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm italic">
                      "Join me on PuntaIQ, the AI-powered sports prediction platform that gives you winning insights! Use my referral code to get 200 welcome points and premium access. Sign up now: {window.location.origin}"
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                      navigator.clipboard.writeText(`Join me on PuntaIQ, the AI-powered sports prediction platform that gives you winning insights! Use my referral code to get 200 welcome points and premium access. Sign up now: ${window.location.origin}`);
                      toast({
                        title: "Copied!",
                        description: "Message copied to clipboard",
                      });
                    }}>
                      Copy Text
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm italic">
                      "Looking for better sports predictions? PuntaIQ uses AI to analyze matches and give you the best picks. I've been using it and it's fantastic! Sign up with my referral code: {window.location.origin}"
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                      navigator.clipboard.writeText(`Looking for better sports predictions? PuntaIQ uses AI to analyze matches and give you the best picks. I've been using it and it's fantastic! Sign up with my referral code: ${window.location.origin}`);
                      toast({
                        title: "Copied!",
                        description: "Message copied to clipboard",
                      });
                    }}>
                      Copy Text
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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