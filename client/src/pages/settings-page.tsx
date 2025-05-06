import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container max-w-screen-lg py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <div className="text-xl font-semibold mb-4">Profile Settings</div>
          <p className="text-muted-foreground">
            Profile settings will be implemented in the future.
          </p>
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <div className="text-xl font-semibold mb-4">Appearance Settings</div>
          <p className="text-muted-foreground">
            Appearance settings will be implemented in the future.
          </p>
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-4">
          <div className="text-xl font-semibold mb-4">Subscription Management</div>
          <p className="text-muted-foreground">
            Subscription management will be implemented in the future.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}