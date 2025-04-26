import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BellRing, BellOff, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

/**
 * Component for managing push notification subscriptions
 */
export default function PushNotificationSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supportsNotifications, setSupportsNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState({
    predictions: true,
    results: true,
    promotions: true,
  });

  const registerTokenMutation = useMutation({
    mutationFn: async (token: { token: string; platform: string; deviceName?: string }) => {
      const res = await apiRequest('POST', '/api/push-tokens', token);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications',
      });
      setNotificationsEnabled(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error enabling notifications',
        description: error.message || 'Failed to enable notifications',
        variant: 'destructive',
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await apiRequest('PATCH', '/api/user/notification-settings', settings);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message || 'Failed to update notification settings',
        variant: 'destructive',
      });
    },
  });

  // Check if the browser supports notifications
  useEffect(() => {
    setSupportsNotifications('Notification' in window);
    setLoading(false);

    // If user is logged in, get their notification settings
    if (user?.notificationSettings) {
      setNotificationTypes(user.notificationSettings);
    }

    // Check if notifications are already enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // In a real app, we would register with Firebase/web push here
        // For now, we'll just simulate it with a dummy token
        registerTokenMutation.mutate({
          token: `browser-token-${Date.now()}`,
          platform: 'web',
          deviceName: navigator.userAgent,
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'You need to allow notifications in your browser settings',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationTypeChange = (type: string, enabled: boolean) => {
    const newSettings = { ...notificationTypes, [type]: enabled };
    setNotificationTypes(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading notification settings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!supportsNotifications) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Notifications Not Supported</AlertTitle>
        <AlertDescription>
          Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationsEnabled ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant updates about predictions, matches, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!notificationsEnabled && (
            <Button onClick={requestNotificationPermission} disabled={registerTokenMutation.isPending}>
              {registerTokenMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <BellRing className="mr-2 h-4 w-4" />
                  Enable Push Notifications
                </>
              )}
            </Button>
          )}

          {notificationsEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="predictions" className="text-sm font-medium">
                  New Predictions
                </Label>
                <Switch
                  id="predictions"
                  checked={notificationTypes.predictions}
                  onCheckedChange={(checked) => handleNotificationTypeChange('predictions', checked)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="results" className="text-sm font-medium">
                  Match Results
                </Label>
                <Switch
                  id="results"
                  checked={notificationTypes.results}
                  onCheckedChange={(checked) => handleNotificationTypeChange('results', checked)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="promotions" className="text-sm font-medium">
                  Promotions & News
                </Label>
                <Switch
                  id="promotions"
                  checked={notificationTypes.promotions}
                  onCheckedChange={(checked) => handleNotificationTypeChange('promotions', checked)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        You can change these settings at any time from your profile
      </CardFooter>
    </Card>
  );
}