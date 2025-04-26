import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Filter, Loader2, TrendingUp, Bell, Paintbrush } from "lucide-react";
import PredictionCard from "@/components/predictions/prediction-card";
import SportsTabs from "@/components/predictions/sports-tabs";
import AccumulatorPanel from "@/components/predictions/accumulator-panel";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/components/notifications/notification-provider";

export default function HomePage() {
  const [_, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();
  const [selectedSport, setSelectedSport] = useState("all");
  
  const { data: predictions, isLoading: isPredictionsLoading } = useQuery({
    queryKey: ['/api/predictions', selectedSport],
    enabled: true, // Load predictions even for non-authenticated users (free tier)
  });
  
  const { data: stats } = useQuery({
    queryKey: ['/api/predictions/stats'],
    enabled: !!user, // Only load stats for authenticated users
  });
  
  const isLoading = isAuthLoading || isPredictionsLoading;
  
  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
  };
  
  // Test notification function
  const handleSendTestNotification = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test the notification system.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createNotification({
        userId: user.id,
        title: "Test Notification",
        message: "This is a test notification from PuntaIQ",
        type: "info",
        link: null,
        icon: null,
        expiresAt: null,
        data: {}
      });
      
      toast({
        title: "Success",
        description: "Test notification sent successfully!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8 max-w-6xl">
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              PuntaIQ Predictions
            </h1>
            <p className="text-muted-foreground">
              Daily predictions powered by advanced machine learning algorithms
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/stats")}
              className="flex items-center"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Stats
            </Button>
            {user ? (
              <Button onClick={() => navigate("/profile")}>
                My Profile
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => navigate("/ui-showcase")}
              className="flex items-center"
            >
              <Paintbrush className="mr-2 h-4 w-4" />
              UI Showcase
            </Button>
          </div>
        </div>
        
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate (7 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.weekSuccessRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.weekCorrect} correct out of {stats.weekTotal}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.monthSuccessRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.monthCorrect} correct out of {stats.monthTotal}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgConfidence}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {stats.totalPredictions} predictions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today's Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todayCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {stats.todaySports} sports
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-background shadow-sm border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Today's Predictions</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm gap-1"
                onClick={() => {}}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <SportsTabs 
              selectedSport={selectedSport}
              onSelectSport={handleSportChange}
            />
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !predictions || predictions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No predictions available for this selection.</p>
                <p className="text-sm mt-2">Try selecting a different sport or check back later.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {predictions.slice(0, 10).map((prediction: any) => (
                  <PredictionCard 
                    key={prediction.id} 
                    prediction={prediction}
                  />
                ))}
                
                {predictions.length > 10 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate("/predictions")}
                  >
                    View All Predictions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <AccumulatorPanel />
          
          {user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Test the real-time notification system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSendTestNotification}
                  className="w-full"
                  variant="default"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                {user ? "Manage your prediction subscription" : "Sign up for premium predictions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <>
                  <div className="mb-4">
                    <p className="font-medium mb-1">Current Plan:</p>
                    <p className="text-primary font-semibold text-lg">
                      {user.subscriptionTier || "Free Tier"}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/subscription")}
                    className="w-full"
                  >
                    {user.subscriptionTier ? "Manage Subscription" : "Upgrade Now"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Sign up for a subscription to access premium predictions and advanced features.
                  </p>
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="w-full mb-2"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/subscription")}
                    className="w-full"
                  >
                    View Plans
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}