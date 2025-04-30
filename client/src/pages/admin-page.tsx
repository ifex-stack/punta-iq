import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { NotificationTestPanel } from '@/components/admin/notification-test-panel';
import { NotificationConnectionStatus } from '@/components/admin/notification-connection-status';
import { NotificationMetricsPanel } from '@/components/admin/notification-metrics-panel';
import { FeatureFlagManager } from '@/components/admin/feature-flag-manager';

export default function AdminPage() {
  const { user } = useAuth();
  
  // Restrict access to admin only (user ID 1 for simplicity)
  if (!user || user.id !== 1) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Admin Dashboard
      </h1>
      <p className="text-muted-foreground mb-6">
        Administrative tools and testing panels
      </p>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 mb-8">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
              <NotificationConnectionStatus />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Notification Testing</h2>
              <NotificationTestPanel />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Notification Metrics</h2>
            <NotificationMetricsPanel />
          </div>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Feature Flag Management</h2>
            <FeatureFlagManager />
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">User Management</h3>
            <p className="text-muted-foreground mt-2">
              User management features will be implemented here
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="space-y-8">
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">App Usage Analytics</h3>
              <p className="text-muted-foreground mt-2">
                App usage analytics will be implemented here, including active users, session length, 
                feature usage, and conversion metrics
              </p>
            </div>
            
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-medium">Prediction Analytics</h3>
              <p className="text-muted-foreground mt-2">
                Prediction accuracy analytics and user engagement metrics will be displayed here
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}