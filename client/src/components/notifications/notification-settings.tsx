import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Check, Info } from "lucide-react";

interface NotificationSettingsProps {
  className?: string;
}

interface NotificationPreferences {
  general: {
    predictions: boolean;
    results: boolean;
    promotions: boolean;
  };
  sports: {
    football: boolean;
    basketball: boolean;
    tennis: boolean;
    baseball: boolean;
    hockey: boolean;
    cricket: boolean;
    formula1: boolean;
    mma: boolean;
    volleyball: boolean;
    other: boolean;
  };
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { user } = useAuth();
  const { hasPermission, requestPermission, isLoading } = useNotifications();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    general: {
      predictions: false,
      results: false,
      promotions: false,
    },
    sports: {
      football: false,
      basketball: false,
      tennis: false,
      baseball: false,
      hockey: false,
      cricket: false,
      formula1: false,
      mma: false,
      volleyball: false,
      other: false,
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "sports">("general");

  // Load user notification preferences
  // Initialize from user notification settings
  useEffect(() => {
    if (user?.notificationSettings) {
      const settings = user.notificationSettings;
      
      // Handle the case where the user has legacy notification settings format
      if (typeof settings.predictions === 'boolean') {
        // This is the old format where notificationSettings are just { predictions, results, promotions }
        setPreferences({
          general: {
            predictions: settings.predictions ?? false,
            results: settings.results ?? false,
            promotions: settings.promotions ?? false,
          },
          sports: {
            football: true,
            basketball: true,
            tennis: true,
            baseball: true,
            hockey: true,
            cricket: true,
            formula1: true,
            mma: true,
            volleyball: true,
            other: true,
          }
        });
      } else {
        // This is the new format with general and sports categories
        setPreferences({
          general: {
            predictions: settings.general?.predictions ?? false,
            results: settings.general?.results ?? false,
            promotions: settings.general?.promotions ?? false,
          },
          sports: {
            football: settings.sports?.football ?? false,
            basketball: settings.sports?.basketball ?? false,
            tennis: settings.sports?.tennis ?? false,
            baseball: settings.sports?.baseball ?? false,
            hockey: settings.sports?.hockey ?? false,
            cricket: settings.sports?.cricket ?? false,
            formula1: settings.sports?.formula1 ?? false,
            mma: settings.sports?.mma ?? false,
            volleyball: settings.sports?.volleyball ?? false,
            other: settings.sports?.other ?? false,
          }
        });
      }
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

  const handleToggleGeneralPreference = async (key: keyof typeof preferences.general) => {
    const newPreferences = {
      ...preferences,
      general: {
        ...preferences.general,
        [key]: !preferences.general[key],
      }
    };
    
    // First update local state for immediate feedback
    setPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      const response = await apiRequest("POST", "/api/notifications/settings", {
        settings: newPreferences,
      });
      
      if (response.ok) {
        // Server returns the complete updated settings
        const data = await response.json();
        
        if (data.success && data.settings) {
          // Use the returned settings from the server
          setPreferences({
            general: {
              predictions: data.settings.general?.predictions ?? false,
              results: data.settings.general?.results ?? false, 
              promotions: data.settings.general?.promotions ?? false
            },
            sports: {
              football: data.settings.sports?.football ?? false,
              basketball: data.settings.sports?.basketball ?? false,
              tennis: data.settings.sports?.tennis ?? false,
              baseball: data.settings.sports?.baseball ?? false,
              hockey: data.settings.sports?.hockey ?? false,
              cricket: data.settings.sports?.cricket ?? false,
              formula1: data.settings.sports?.formula1 ?? false,
              mma: data.settings.sports?.mma ?? false,
              volleyball: data.settings.sports?.volleyball ?? false,
              other: data.settings.sports?.other ?? false
            }
          });
          
          // Force refresh the user data in the auth context
          // This keeps everything in sync
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
      }
      
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
  
  const handleToggleSportPreference = async (sport: keyof typeof preferences.sports) => {
    const newPreferences = {
      ...preferences,
      sports: {
        ...preferences.sports,
        [sport]: !preferences.sports[sport],
      }
    };
    
    // First update local state for immediate feedback
    setPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      const response = await apiRequest("POST", "/api/notifications/settings", {
        settings: newPreferences,
      });
      
      if (response.ok) {
        // Server returns the complete updated settings
        const data = await response.json();
        
        if (data.success && data.settings) {
          // Use the returned settings from the server
          setPreferences({
            general: {
              predictions: data.settings.general?.predictions ?? false,
              results: data.settings.general?.results ?? false, 
              promotions: data.settings.general?.promotions ?? false
            },
            sports: {
              football: data.settings.sports?.football ?? false,
              basketball: data.settings.sports?.basketball ?? false,
              tennis: data.settings.sports?.tennis ?? false,
              baseball: data.settings.sports?.baseball ?? false,
              hockey: data.settings.sports?.hockey ?? false,
              cricket: data.settings.sports?.cricket ?? false,
              formula1: data.settings.sports?.formula1 ?? false,
              mma: data.settings.sports?.mma ?? false,
              volleyball: data.settings.sports?.volleyball ?? false,
              other: data.settings.sports?.other ?? false
            }
          });
          
          // Force refresh the user data in the auth context
          // This keeps everything in sync
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
      }
      
      toast({
        title: "Settings saved",
        description: `${newPreferences.sports[sport] ? 'Enabled' : 'Disabled'} notifications for ${sport}`,
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "general" | "sports")}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="general" className="flex-1">General Settings</TabsTrigger>
            <TabsTrigger value="sports" className="flex-1">Sport Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
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
                checked={preferences.general.predictions}
                onCheckedChange={() => handleToggleGeneralPreference("predictions")}
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
                checked={preferences.general.results}
                onCheckedChange={() => handleToggleGeneralPreference("results")}
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
                checked={preferences.general.promotions}
                onCheckedChange={() => handleToggleGeneralPreference("promotions")}
                disabled={isSaving}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="sports" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Notifications by Sport</h3>
              <div className="flex text-xs text-muted-foreground">
                <span className="mr-2">Off</span>
                <span>On</span>
              </div>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(preferences.sports).map(([sport, enabled]) => (
                <div key={sport} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium capitalize">{sport}</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notifications for {sport} matches and predictions
                    </p>
                  </div>
                  <Switch
                    id={`sport-${sport}`}
                    checked={enabled}
                    onCheckedChange={() => handleToggleSportPreference(sport as keyof typeof preferences.sports)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
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