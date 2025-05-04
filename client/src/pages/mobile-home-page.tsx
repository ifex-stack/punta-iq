import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronRight, 
  Filter, 
  Loader2, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Sparkles, 
  ArrowRight,
  BadgeCheck,
  PieChart,
  ArrowUpRight,
  Trophy,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mobile UI components
import { MobileHeader } from "@/components/ui/mobile-header";
import { MobileNavbar } from "@/components/ui/mobile-navbar";
import { MobileHeroSection } from "@/components/ui/mobile-hero-section";
import { FeatureCard } from "@/components/ui/feature-card";

import { AIServiceStatusIndicator } from "@/components/status/ai-service-status-indicator";

export default function MobileHomePage() {
  const [_, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState("all");
  
  // Types for the data
  interface Prediction {
    id: string;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    confidence: number;
    startTime: string;
    odds: number;
    [key: string]: any;
  }
  
  interface StatsData {
    weekSuccessRate: number;
    weekCorrect: number;
    weekTotal: number;
    monthSuccessRate: number;
    monthCorrect: number;
    monthTotal: number;
    avgConfidence: number;
    totalPredictions: number;
    todayCount: number;
    todaySports: number;
  }
  
  // Fetch predictions
  const { data: predictions, isLoading: isPredictionsLoading } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions', selectedSport],
    enabled: true, // Load predictions even for non-authenticated users
  });
  
  // Fetch stats
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['/api/predictions/stats'],
    enabled: !!user, // Only load stats for authenticated users
  });
  
  const isLoading = isAuthLoading || isPredictionsLoading;
  
  // Feature cards
  const features = [
    {
      icon: Activity,
      title: "AI Predictions",
      description: "Get daily match predictions with AI-based insights and confidence ratings.",
      iconBackgroundColor: "bg-blue-500",
      path: "/predictions"
    },
    {
      icon: TrendingUp,
      title: "Accumulators",
      description: "AI-generated multi-match accumulators with high potential returns.",
      iconBackgroundColor: "bg-purple-600",
      path: "/accumulators"
    },
    {
      icon: BarChart3,
      title: "Live Scores",
      description: "Real-time scores, match stats, and live updates across all sports.",
      iconBackgroundColor: "bg-green-500",
      path: "/livescore"
    },
    {
      icon: Trophy,
      title: "Fantasy Contests",
      description: "Participate in daily fantasy contests with other users and win prizes.",
      iconBackgroundColor: "bg-amber-500",
      path: "/fantasy-contests"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          {/* Hero Section */}
          <MobileHeroSection 
            title="AI Sports Predictions"
            description="Smart predictions powered by artificial intelligence to help you make informed decisions."
            primaryActionLabel="View Predictions"
            primaryActionPath="/predictions"
            secondaryActionLabel="Explore"
            secondaryActionPath="/accumulators"
          />
          
          {/* Service Status */}
          <div className="mb-4">
            <AIServiceStatusIndicator size="large" />
          </div>
          
          {/* Quick Stats Cards (if authenticated) */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold">{stats.weekSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">Success (7d)</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold">{stats.avgConfidence}%</div>
                  <p className="text-xs text-muted-foreground">Avg. Confidence</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold">{stats.monthSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">Success (30d)</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold">{stats.todayCount}</div>
                  <p className="text-xs text-muted-foreground">Today's Picks</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Call to action for non-authenticated users */}
          {!user && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-4 text-white mb-6">
              <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
              <p className="text-sm mb-3">Get access to all predictions, statistics, and advanced features.</p>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-blue-700 hover:bg-white/90"
                onClick={() => navigate("/auth")}
              >
                Create Free Account
              </Button>
            </div>
          )}
          
          {/* Feature Cards */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-bold">Features</h2>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                iconBackgroundColor={feature.iconBackgroundColor}
                onClick={() => navigate(feature.path)}
              />
            ))}
          </div>
          
          {/* Today's Accumulators */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Today's Accumulators</h2>
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow-md text-white overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">AI Accumulators</h3>
                      <p className="text-xs text-white/90">
                        Ready-made AI selections
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/10 rounded p-2 text-center">
                      <div className="text-lg font-bold">2x</div>
                      <div className="text-xs">Double</div>
                    </div>
                    <div className="bg-white/10 rounded p-2 text-center">
                      <div className="text-lg font-bold">5x</div>
                      <div className="text-xs">Treble</div>
                    </div>
                    <div className="bg-white/10 rounded p-2 text-center">
                      <div className="text-lg font-bold">10x</div>
                      <div className="text-xs">4-Fold</div>
                    </div>
                  </div>
                  <Button 
                    variant="secondary"
                    className="w-full bg-white hover:bg-white/90 text-blue-600 border-0"
                    onClick={() => navigate("/accumulators")}
                  >
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Today's Predictions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Today's Predictions</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/predictions")}
                className="text-blue-600 dark:text-blue-400"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !predictions || predictions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No predictions available. Check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.slice(0, 3).map((prediction: Prediction) => (
                  <Card key={prediction.id} className="bg-white dark:bg-gray-900 border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-normal">
                              {prediction.sport}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              {prediction.league}
                            </span>
                          </div>
                          <div className="mt-1 font-medium">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                        </div>
                        <Badge className={`${
                          prediction.confidence >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                          prediction.confidence >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}>
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Prediction: </span>
                          <span className="font-medium">{prediction.prediction}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Odds: </span>
                          <span className="font-medium">{prediction.odds.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Testimonials or Additional Features */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-3">Why Choose PuntaIQ</h2>
            <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm mb-3">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">AI-Powered Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Our advanced AI analyzes thousands of data points to generate predictions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm mb-3">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Proven Accuracy</h3>
                    <p className="text-sm text-muted-foreground">
                      Our predictions have a 70%+ success rate across all major sports.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-900 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <ArrowUpRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Real-Time Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications for important events and prediction updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <MobileNavbar />
    </div>
  );
}