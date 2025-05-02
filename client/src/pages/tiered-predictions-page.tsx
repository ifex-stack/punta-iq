import React, { useState } from 'react';
import { 
  TieredPredictionsList, 
  TieredAccumulatorsList,
  TierInfoCard,
  TierLevel
} from '@/components/tiers';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lock,
  TrendingUp,
  BarChart3,
  Trophy,
  CrownIcon,
  Layers,
  PercentIcon
} from 'lucide-react';

export default function TieredPredictionsPage() {
  const [activeTab, setActiveTab] = useState<string>('predictions');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">PuntaIQ Premium Predictions</h1>
        <p className="text-muted-foreground mb-6">
          AI-powered predictions organized by confidence and value, with premium tiers for serious bettors.
        </p>
        
        {/* Premium Tier Banner */}
        {!isPremiumUser && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <CrownIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Unlock Premium Predictions</h3>
                  <p className="text-muted-foreground">
                    Get access to Tier 1 & Tier 2 premium predictions with higher accuracy and value
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => window.location.href = "/subscription-page"}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
        
        {/* Tier Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col items-center text-center bg-muted/20 p-4 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">Tiered System</h3>
            <p className="text-sm text-muted-foreground">
              Predictions organized into 4 tiers based on confidence and value
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center bg-muted/20 p-4 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
              <PercentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">Confidence Score</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered confidence ratings with detailed explanations
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center bg-muted/20 p-4 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">Value Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatic edge detection to find the best betting value
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center bg-muted/20 p-4 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">Smart Accumulators</h3>
            <p className="text-sm text-muted-foreground">
              Tier-based accumulators with optimal combinations for better returns
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs 
        defaultValue="predictions" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="predictions">Single Predictions</TabsTrigger>
          <TabsTrigger value="accumulators">Smart Accumulators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="predictions" className="mt-0">
          <TieredPredictionsList 
            initialSport="football"
            initialTier="all"
            showFilter={true}
            showTiers={false}
          />
        </TabsContent>
        
        <TabsContent value="accumulators" className="mt-0">
          <TieredAccumulatorsList 
            initialTier="all"
            initialCategory="all"
            showFilter={true}
            showGrouping={true}
          />
        </TabsContent>
      </Tabs>
      
      {/* Tier Details Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Understanding Our Tier System</h2>
        <p className="text-muted-foreground mb-6">
          Our proprietary AI system automatically classifies predictions into four tiers based on confidence levels, statistical edge, and historical performance.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TierInfoCard tier="Tier 1" />
          <TierInfoCard tier="Tier 2" />
          <TierInfoCard tier="Tier 5" />
          <TierInfoCard tier="Tier 10" />
        </div>
      </div>
    </div>
  );
}