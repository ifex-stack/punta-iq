import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, Bell, Moon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { detectUserTimezone, timezoneOptions } from "@/lib/timezone-service";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function TimezonePreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Load user preferences
  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ["/api/user/preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/preferences");
      return response.json();
    },
  });
  
  // State for timezone preferences
  const [timezone, setTimezone] = useState<string | null>(null);
  const [autoDetectTimezone, setAutoDetectTimezone] = useState(true);
  const [predictionsTime, setPredictionsTime] = useState("08:00");
  const [resultsTime, setResultsTime] = useState("22:00");
  const [newsTime, setNewsTime] = useState("12:00");
  const [promotionsTime, setPromotionsTime] = useState("18:00");
  const [respectQuietHours, setRespectQuietHours] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState("23:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [weekdays, setWeekdays] = useState(true);
  const [weekends, setWeekends] = useState(true);
  
  // Initialize state from preferences
  useEffect(() => {
    if (preferences?.timezone) {
      setTimezone(preferences.timezone);
    } else {
      // Auto-detect timezone if not set
      setTimezone(detectUserTimezone());
    }
    
    if (preferences?.autoDetectTimezone !== undefined) {
      setAutoDetectTimezone(preferences.autoDetectTimezone);
    }
    
    if (preferences?.preferredContentDeliveryTimes) {
      const times = preferences.preferredContentDeliveryTimes;
      if (times.predictions) setPredictionsTime(times.predictions);
      if (times.results) setResultsTime(times.results);
      if (times.news) setNewsTime(times.news);
      if (times.promotions) setPromotionsTime(times.promotions);
    }
    
    if (preferences?.schedulingPreferences) {
      const scheduling = preferences.schedulingPreferences;
      if (scheduling.respectQuietHours !== undefined) setRespectQuietHours(scheduling.respectQuietHours);
      if (scheduling.quietHoursStart) setQuietHoursStart(scheduling.quietHoursStart);
      if (scheduling.quietHoursEnd) setQuietHoursEnd(scheduling.quietHoursEnd);
      if (scheduling.weekdays !== undefined) setWeekdays(scheduling.weekdays);
      if (scheduling.weekends !== undefined) setWeekends(scheduling.weekends);
    }
  }, [preferences]);
  
  // Auto-detect timezone when toggled
  useEffect(() => {
    if (autoDetectTimezone) {
      setTimezone(detectUserTimezone());
    }
  }, [autoDetectTimezone]);
  
  // Mutation for saving preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: any) => {
      const response = await apiRequest("POST", "/api/user/preferences", newPreferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your timezone preferences have been updated",
        variant: "default"
      });
      setLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setLoading(false);
    }
  });
  
  const handleSavePreferences = async () => {
    setLoading(true);
    
    // Prepare the new preferences object
    const timezonePreferences = {
      timezone,
      autoDetectTimezone,
      preferredContentDeliveryTimes: {
        predictions: predictionsTime,
        results: resultsTime,
        news: newsTime,
        promotions: promotionsTime
      },
      schedulingPreferences: {
        respectQuietHours,
        quietHoursStart,
        quietHoursEnd,
        weekdays,
        weekends
      }
    };
    
    // Save preferences
    savePreferencesMutation.mutate(timezonePreferences);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Timezone & Notification Preferences</h2>
        <Button onClick={handleSavePreferences} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Timezone Settings
            </CardTitle>
            <CardDescription>Manage your timezone preferences for content delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detect">Auto-detect timezone</Label>
                <Switch 
                  id="auto-detect" 
                  checked={autoDetectTimezone} 
                  onCheckedChange={setAutoDetectTimezone} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically detect your timezone from your browser
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Your timezone</Label>
              <Select 
                disabled={autoDetectTimezone} 
                value={timezone || ''} 
                onValueChange={setTimezone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {autoDetectTimezone 
                  ? "Your timezone is automatically detected as: " + timezone
                  : "Choose your timezone manually"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              Content Delivery Times
            </CardTitle>
            <CardDescription>Set your preferred times for different content types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="predictions-time">Predictions delivery time</Label>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  id="predictions-time"
                  value={predictionsTime}
                  onChange={(e) => setPredictionsTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm font-medium">{predictionsTime}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="results-time">Results delivery time</Label>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  id="results-time"
                  value={resultsTime}
                  onChange={(e) => setResultsTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm font-medium">{resultsTime}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="news-time">News delivery time</Label>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  id="news-time"
                  value={newsTime}
                  onChange={(e) => setNewsTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm font-medium">{newsTime}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotions-time">Promotions delivery time</Label>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  id="promotions-time"
                  value={promotionsTime}
                  onChange={(e) => setPromotionsTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm font-medium">{promotionsTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-500" />
              Quiet Hours
            </CardTitle>
            <CardDescription>Set times when you don't want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="respect-quiet-hours">Respect quiet hours</Label>
                <Switch 
                  id="respect-quiet-hours" 
                  checked={respectQuietHours} 
                  onCheckedChange={setRespectQuietHours} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Don't send notifications during your quiet hours
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Quiet hours start</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="time"
                    id="quiet-start"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    disabled={!respectQuietHours}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-medium">{quietHoursStart}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Quiet hours end</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="time"
                    id="quiet-end"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    disabled={!respectQuietHours}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-medium">{quietHoursEnd}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Scheduled Days
            </CardTitle>
            <CardDescription>Choose which days to receive content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekdays">Weekdays (Monday-Friday)</Label>
                <Switch 
                  id="weekdays" 
                  checked={weekdays} 
                  onCheckedChange={setWeekdays} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Receive content on weekdays
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekends">Weekends (Saturday-Sunday)</Label>
                <Switch 
                  id="weekends" 
                  checked={weekends} 
                  onCheckedChange={setWeekends} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Receive content on weekends
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}