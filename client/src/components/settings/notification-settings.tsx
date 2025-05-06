import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Schema for notification settings form
const notificationSettingsSchema = z.object({
  dailyDigest: z.boolean().default(true),
  matchAlerts: z.boolean().default(true),
  predictionResults: z.boolean().default(true),
  valueBetAlerts: z.boolean().default(false),
  timezone: z.string().default('Europe/London'),
  digestTime: z.string().default('07:00'),
  pushEnabled: z.boolean().default(true)
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

const timezones = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' }
];

const digestTimes = [
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '21:00', label: '9:00 PM' }
];

export function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current notification settings
  const { data: settings, isLoading, error } = useQuery<NotificationSettingsValues>({
    queryKey: ['/api/notifications/settings'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const form = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: settings || {
      dailyDigest: true,
      matchAlerts: true,
      predictionResults: true,
      valueBetAlerts: false,
      timezone: 'Europe/London',
      digestTime: '07:00',
      pushEnabled: true
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  // Save notification settings
  const mutation = useMutation({
    mutationFn: async (values: NotificationSettingsValues) => {
      setIsSaving(true);
      const response = await apiRequest('PUT', '/api/notifications/settings', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/notifications/settings']});
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message || 'Failed to save notification settings.',
        variant: 'destructive',
      });
      setIsSaving(false);
    },
  });

  function onSubmit(values: NotificationSettingsValues) {
    mutation.mutate(values);
  }

  // Send a test notification
  const testNotification = async (type: string) => {
    try {
      setIsSaving(true);
      const response = await apiRequest('POST', '/api/notifications/test', { type });
      const data = await response.json();
      
      toast({
        title: 'Test notification sent',
        description: 'A test notification has been scheduled. You should receive it shortly.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending test notification',
        description: error.message || 'Failed to send test notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-red-500 text-center">
            Error loading notification settings. Please try again later.
          </div>
          <Button onClick={() => queryClient.invalidateQueries({queryKey: ['/api/notifications/settings']})}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="pushEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Push Notifications
                      </FormLabel>
                      <FormDescription>
                        Allow PuntaIQ to send you notifications about predictions, matches, and more.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Notification Types</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dailyDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Daily Prediction Digest</FormLabel>
                          <FormDescription>
                            Receive a daily summary of today's top predictions.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('pushEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="matchAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Match Alerts</FormLabel>
                          <FormDescription>
                            Get notified before matches with selected teams are starting.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('pushEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="predictionResults"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Prediction Results</FormLabel>
                          <FormDescription>
                            Receive notifications when predictions have been decided.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('pushEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="valueBetAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Value Bet Alerts</FormLabel>
                          <FormDescription>
                            Get notified when high-value betting opportunities are identified.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('pushEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Delivery Settings</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Timezone</FormLabel>
                        <FormDescription>
                          Select your timezone for properly timed notifications.
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch('pushEnabled')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="digestTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Digest Time</FormLabel>
                        <FormDescription>
                          When would you like to receive your daily prediction digest?
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch('pushEnabled') || !form.watch('dailyDigest')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {digestTimes.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Test Notifications</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('daily_digest')}
                    disabled={isSaving || !form.watch('pushEnabled') || !form.watch('dailyDigest')}
                  >
                    Test Daily Digest
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('match_alert')}
                    disabled={isSaving || !form.watch('pushEnabled') || !form.watch('matchAlerts')}
                  >
                    Test Match Alert
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('prediction_result')}
                    disabled={isSaving || !form.watch('pushEnabled') || !form.watch('predictionResults')}
                  >
                    Test Prediction Result
                  </Button>
                </div>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}