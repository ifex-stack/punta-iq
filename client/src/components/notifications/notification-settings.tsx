import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell, BellOff, Info } from "lucide-react";
import { isNotificationsSupported } from "@/lib/firebase";

export function NotificationSettings() {
  const { hasPermission, isLoading, requestPermission } = useNotifications();

  const handleRequestPermission = async () => {
    if (!isNotificationsSupported()) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications. Please try using a different browser.",
        variant: "destructive",
      });
      return;
    }

    await requestPermission();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
          {hasPermission ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <CardDescription>
          Choose what type of notifications you want to receive and how you receive them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Push Notifications</div>
            <div className="text-sm text-muted-foreground">
              {hasPermission
                ? "Notifications are enabled for this device"
                : "Notifications are currently disabled"}
            </div>
          </div>
          <Button
            variant={hasPermission ? "outline" : "default"}
            size="sm"
            onClick={handleRequestPermission}
            disabled={isLoading}
          >
            {hasPermission ? "Enabled" : "Enable Notifications"}
          </Button>
        </div>

        {hasPermission && (
          <>
            <div className="pt-2 border-t">
              <h3 className="font-medium mb-3">Notification Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Prediction Alerts</div>
                    <div className="text-sm text-muted-foreground">Get notified when new predictions are available</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Match Reminders</div>
                    <div className="text-sm text-muted-foreground">Receive reminders before matches start</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Results & Updates</div>
                    <div className="text-sm text-muted-foreground">Get notifications about match results and prediction outcomes</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">News & Promotions</div>
                    <div className="text-sm text-muted-foreground">Receive updates about app features and special offers</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Info className="h-4 w-4 mr-1" />
          Your settings are automatically saved
        </div>
        {!isNotificationsSupported() && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            Your browser doesn't fully support notifications
          </div>
        )}
      </CardFooter>
    </Card>
  );
}