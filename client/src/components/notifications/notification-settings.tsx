import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check, Info } from "lucide-react";

interface NotificationSettingsProps {
  className?: string;
}

interface NotificationPreferences {
  predictions: boolean;
  results: boolean;
  promotions: boolean;
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { user } = useAuth();
  const { hasPermission, requestPermission, isLoading } = useNotifications();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    predictions: false,
    results: false,
    promotions: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load user notification preferences
  useEffect(() => {
    if (user?.notificationSettings) {
      setPreferences({
        predictions: user.notificationSettings.predictions || false,
        results: user.notificationSettings.results || false,
        promotions: user.notificationSettings.promotions || false,
      });
    }
  }, [user]);

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
      toast({
        title: "Notifications enabled",
        description: "You will now receive notifications from PuntaIQ",
      });
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }
  };

  const handleTogglePreference = async (category: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [category]: !preferences[category],
    };
    
    setPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      await apiRequest("PATCH", "/api/user/notification-settings", {
        settings: newPreferences,
      });
      
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      // Revert to previous state if save fails
      setPreferences(preferences);
      toast({
        title: "Failed to save settings",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Choose what notifications you would like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!hasPermission) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Enable Notifications</CardTitle>
          <CardDescription>
            Get timely updates about predictions, match results, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <BellOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground max-w-md">
              Notifications are currently disabled. Enable notifications to stay updated
              with the latest predictions, match results, and special offers.
            </p>
            <Button onClick={handleRequestPermission} className="mt-2">
              Enable Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Choose what notifications you would like to receive
            </CardDescription>
          </div>
          <Bell className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="predictions" className="text-base">
                Predictions
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when new predictions are available
              </p>
            </div>
            <Switch
              id="predictions"
              checked={preferences.predictions}
              onCheckedChange={() => handleTogglePreference("predictions")}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="results" className="text-base">
                Match Results
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about the outcomes of your tracked matches
              </p>
            </div>
            <Switch
              id="results"
              checked={preferences.results}
              onCheckedChange={() => handleTogglePreference("results")}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="promotions" className="text-base">
                Promotions & Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Offers, new features, and other promotional content
              </p>
            </div>
            <Switch
              id="promotions"
              checked={preferences.promotions}
              onCheckedChange={() => handleTogglePreference("promotions")}
              disabled={isSaving}
            />
          </div>
        </div>
        
        {isSaving && (
          <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            Saving preferences...
          </div>
        )}
        
        <div className="mt-6 flex items-start p-4 border rounded-lg bg-muted/30">
          <Info className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            You can also disable notifications completely in your browser settings.
            If you're having trouble with notifications, try refreshing the page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}