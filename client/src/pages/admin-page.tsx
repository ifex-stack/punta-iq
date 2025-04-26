import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { NotificationTestPanel } from '@/components/admin/notification-test-panel';

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
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Notification Testing</h2>
            <NotificationTestPanel />
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
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Analytics Dashboard</h3>
            <p className="text-muted-foreground mt-2">
              Analytics features will be implemented here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}