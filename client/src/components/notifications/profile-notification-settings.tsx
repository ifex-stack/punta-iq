import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ProfileNotificationSettings() {
  const { user } = useAuth();
  const { hasPermission, requestPermission, disableNotifications, isLoading } = useNotifications();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(
    user?.notificationSettings || {
      predictions: false,
      results: false,
      promotions: false
    }
  );

  const handleToggleSetting = async (key: string) => {
    // First update UI for immediate feedback
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));

    setIsSaving(true);
    try {
      // Save to backend
      await apiRequest("PATCH", "/api/user/notification-settings", {
        ...notificationSettings,
        [key]: !notificationSettings[key]
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      // Revert on error
      setNotificationSettings((prev) => ({
        ...prev,
        [key]: prev[key]
      }));
      
      toast({
        title: "Error",
        description: "Could not save notification settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setIsSaving(true);
      const result = await requestPermission();
      
      if (result === 'granted' || result === true) {
        toast({
          title: "Notifications enabled",
          description: "You will now receive notifications from PuntaIQ"
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setIsSaving(true);
      const result = await disableNotifications();
      
      if (result) {
        toast({
          title: "Notifications disabled",
          description: "You will no longer receive notifications"
        });
        
        // Update local settings to reflect disabled state
        setNotificationSettings({
          predictions: false,
          results: false,
          promotions: false
        });
        
        // Update server settings
        await apiRequest("PATCH", "/api/user/notification-settings", {
          predictions: false,
          results: false,
          promotions: false
        });
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        toast({
          title: "Error",
          description: "Failed to disable notifications",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h3 className="font-medium">Enable Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get timely updates about predictions, match results, and more
            </p>
          </div>
          <Button 
            onClick={handleEnableNotifications} 
            disabled={isSaving}
            className="relative"
          >
            {isSaving ? (
              <>
                <span className="opacity-0">Enable</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <h3 className="font-medium">Notification Status</h3>
          <p className="text-sm text-muted-foreground">
            Notifications are currently enabled
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleDisableNotifications}
          disabled={isSaving}
          className="relative"
        >
          {isSaving ? (
            <>
              <span className="opacity-0">Disable All</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </>
          ) : (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              Disable All
            </>
          )}
        </Button>
      </div>
      
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-medium">Prediction Alerts</h3>
          <p className="text-sm text-muted-foreground">Get notified about new predictions</p>
        </div>
        <div>
          <Button 
            variant={notificationSettings.predictions ? "default" : "outline"}
            onClick={() => handleToggleSetting('predictions')}
            disabled={isSaving}
          >
            {notificationSettings.predictions ? "On" : "Off"}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-medium">Results Notifications</h3>
          <p className="text-sm text-muted-foreground">Get notified when your predictions are settled</p>
        </div>
        <div>
          <Button 
            variant={notificationSettings.results ? "default" : "outline"}
            onClick={() => handleToggleSetting('results')}
            disabled={isSaving}
          >
            {notificationSettings.results ? "On" : "Off"}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="font-medium">Promotions & News</h3>
          <p className="text-sm text-muted-foreground">Stay updated on new features and offers</p>
        </div>
        <div>
          <Button 
            variant={notificationSettings.promotions ? "default" : "outline"}
            onClick={() => handleToggleSetting('promotions')}
            disabled={isSaving}
          >
            {notificationSettings.promotions ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );
}