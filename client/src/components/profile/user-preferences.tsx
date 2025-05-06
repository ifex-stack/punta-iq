import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Sliders, Activity, Clock, Globe } from "lucide-react";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { CurrencyRecommendationContainer } from "@/components/currency/currency-recommendation-provider";
import { useCurrencyRecommendation } from "@/components/currency/currency-recommendation-provider";
import { getQueryFn } from "@/lib/queryClient";

export function UserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { resetRecommendation } = useCurrencyRecommendation();
  const [editMode, setEditMode] = useState(false);
  
  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ["/user-preferences"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const sportNames: Record<string, string> = {
    football: "Football (Soccer)",
    baseball: "Baseball",
    basketball: "Basketball", 
    rugby: "Rugby",
    tennis: "Tennis",
    hockey: "Hockey",
    golf: "Golf",
    mma: "MMA",
    boxing: "Boxing",
    esports: "Esports"
  };
  
  const experienceLevelNames: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    expert: "Expert"
  };
  
  const bettingFrequencyNames: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    occasional: "Occasional"
  };
  
  const riskToleranceNames: Record<string, string> = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk"
  };
  
  const oddsFormatNames: Record<string, string> = {
    decimal: "Decimal (European)",
    fractional: "Fractional (UK)",
    american: "American (US)",
    hongkong: "Hong Kong",
    indonesian: "Indonesian",
    malay: "Malaysian"
  };

  const handleEditPreferences = () => {
    setEditMode(!editMode);
    if (editMode) {
      toast({
        title: "Edit mode exited",
        description: "Use the onboarding flow to update your preferences"
      });
    }
  };
  
  const handleRunOnboarding = () => {
    // Dispatch event to open onboarding
    window.dispatchEvent(new CustomEvent('open-onboarding'));
    setEditMode(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!preferences) {
    return (
      <div className="space-y-4 text-center p-6">
        <h3 className="text-lg font-semibold">No Preferences Set</h3>
        <p className="text-muted-foreground">
          You haven't completed onboarding yet. Set up your preferences to get personalized predictions.
        </p>
        <Button onClick={handleRunOnboarding}>
          Complete Onboarding
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Preferences</h2>
        <Button onClick={handleRunOnboarding}>
          Update Preferences
        </Button>
      </div>
      
      {/* Currency recommendation banner */}
      <div className="mb-6">
        <CurrencyRecommendationContainer />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Currency Settings
            </CardTitle>
            <CardDescription>Customize your preferred currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-muted-foreground">Preferred Currency:</span>
              <CurrencySelector variant="outline" showLabel={true} />
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-muted-foreground">Location Detection:</span>
              <Badge variant="outline" className="px-3 py-1">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reset Currency Settings:</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  resetRecommendation();
                  toast({
                    title: "Currency settings reset",
                    description: "Your currency preferences have been reset",
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Favorite Sports
            </CardTitle>
            <CardDescription>Your preferred sports for predictions</CardDescription>
          </CardHeader>
          <CardContent>
            {preferences.favoriteSports && preferences.favoriteSports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferences.favoriteSports.map((sport: string) => (
                  <Badge key={sport} variant="outline" className="px-3 py-1">
                    {sportNames[sport] || sport}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No favorite sports selected</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Betting Preferences
            </CardTitle>
            <CardDescription>Your betting style and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.riskTolerance && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Risk Tolerance:</span>
                <span className="font-medium">{riskToleranceNames[preferences.riskTolerance] || preferences.riskTolerance}</span>
              </div>
            )}
            
            {preferences.bettingFrequency && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Betting Frequency:</span>
                <span className="font-medium">{bettingFrequencyNames[preferences.bettingFrequency] || preferences.bettingFrequency}</span>
              </div>
            )}
            
            {preferences.experienceLevel && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Experience Level:</span>
                <span className="font-medium">{experienceLevelNames[preferences.experienceLevel] || preferences.experienceLevel}</span>
              </div>
            )}
            
            {preferences.preferredOddsFormat && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Odds Format:</span>
                <span className="font-medium">{oddsFormatNames[preferences.preferredOddsFormat] || preferences.preferredOddsFormat}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-500" />
              Prediction Settings
            </CardTitle>
            <CardDescription>How predictions are shown to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.predictionsPerDay && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Daily Predictions:</span>
                <Badge variant="outline">{preferences.predictionsPerDay}</Badge>
              </div>
            )}
            
            {preferences.notificationTime && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Notification Time:</span>
                <span className="font-medium">{preferences.notificationTime}</span>
              </div>
            )}
            
            {preferences.analysisDepth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analysis Depth:</span>
                <span className="font-medium">{preferences.analysisDepth === 'detailed' ? 'Detailed' : 'Simplified'}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Daily Summary
            </CardTitle>
            <CardDescription>Your personalized experience in numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tracked Sports:</span>
              <span className="font-semibold">{preferences.favoriteSports?.length || 0}</span>
            </div>
            
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Daily Predictions:</span>
              <span className="font-semibold">{preferences.predictionsPerDay || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Onboarding Completed:</span>
              <span className="font-semibold text-green-500">Yes</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}