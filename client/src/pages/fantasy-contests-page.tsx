import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Crown, Trophy } from 'lucide-react';
import FantasyContestList from '@/components/fantasy/fantasy-contest-list';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function FantasyContestsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { user } = useAuth();
  const isPremiumUser = user?.subscriptionTier === 'premium';
  const [_, setLocation] = useLocation();

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fantasy Contests</h1>
          <p className="text-muted-foreground mt-1">Compete with other fans for prizes and glory.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setLocation('/fantasy/my-teams')}
          >
            My Teams
          </Button>
          <Button 
            variant="default"
            onClick={() => setLocation('/fantasy/contests/create')}
          >
            Create Team
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">All Contests</TabsTrigger>
          <TabsTrigger value="free">Free Contests</TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center">
            <Crown className="h-4 w-4 mr-1" /> Premium
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6 space-y-8">
          {!isPremiumUser && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl mb-8 border border-amber-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="bg-amber-100 p-3 rounded-full mr-4">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">Unlock Premium Contests</h3>
                    <p className="text-amber-700">
                      Upgrade today to participate in premium contests with real cash prizes!
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  onClick={() => setLocation('/subscription')}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold">Upcoming Contests</h2>
            </div>
            <FantasyContestList status="upcoming" limit={6} />
          </div>
          
          <Separator />
          
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold">Active Contests</h2>
            </div>
            <FantasyContestList status="active" limit={3} />
          </div>
        </TabsContent>
        
        <TabsContent value="free" className="mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Free Fantasy Contests</h2>
            <p className="text-muted-foreground mb-6">
              Join our free fantasy contests to practice your skills and compete with other fans.
              No entry fee required - just build your team and play!
            </p>
            
            <FantasyContestList tier="free" limit={12} />
          </div>
        </TabsContent>
        
        <TabsContent value="premium" className="mt-6">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Crown className="h-5 w-5 text-amber-500 mr-2" />
              <h2 className="text-xl font-semibold">Premium Fantasy Contests</h2>
            </div>
            
            {isPremiumUser ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 mb-6">
                <p className="text-green-800 flex items-center">
                  <Trophy className="h-5 w-5 text-green-600 mr-2" />
                  You have premium access! Compete for real cash prizes in our exclusive contests.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl mb-6 border border-amber-200">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">Premium Benefits</h3>
                    <ul className="list-disc list-inside text-amber-700 mt-2">
                      <li>Compete for real cash prizes up to £100</li>
                      <li>Exclusive premium-only contests</li>
                      <li>Enhanced stats and analytics</li>
                      <li>Priority customer support</li>
                    </ul>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white whitespace-nowrap"
                    onClick={() => setLocation('/subscription')}
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            )}
            
            <FantasyContestList tier="premium" limit={12} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}