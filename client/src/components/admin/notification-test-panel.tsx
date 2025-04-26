import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationTestPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test notification message');
  const [type, setType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // For simplicity, consider user ID 1 as admin
    if (user?.id === 1) {
      setIsAdmin(true);
      setTargetUserId(1); // Default to self
    }
  }, [user]);

  const sendTestNotification = async () => {
    if (!title || !body) {
      toast({
        title: 'Missing fields',
        description: 'Title and body are required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If admin and sending to another user
      if (isAdmin && targetUserId && targetUserId !== user?.id) {
        const response = await apiRequest('POST', '/api/admin/send-notification', {
          userId: targetUserId,
          title,
          body,
          type,
          data: { 
            source: 'test-panel',
            timestamp: new Date().toISOString()
          }
        });
        
        const data = await response.json();
        
        toast({
          title: 'Admin notification sent',
          description: `Sent to user ${targetUserId}: ${data.message}`,
          variant: 'success',
        });
      } else {
        // Regular notification to self
        const response = await apiRequest('POST', '/api/notifications/test', {
          title,
          body,
          data: { 
            source: 'test-panel',
            timestamp: new Date().toISOString()
          }
        });
        
        const data = await response.json();
        
        toast({
          title: 'Notification sent',
          description: data.message,
          variant: 'success',
        });
      }
      
      // Invalidate notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error: any) {
      toast({
        title: 'Failed to send notification',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If notifications are disabled in feature flags, don't show the panel
  if (!flags.notifications) {
    return null;
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Notifications</CardTitle>
          {isAdmin && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              Admin Mode
            </Badge>
          )}
        </div>
        <CardDescription>
          Send test notifications to try out the notification system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Target User ID</label>
            <Input
              type="number"
              value={targetUserId || ''}
              onChange={(e) => setTargetUserId(parseInt(e.target.value) || undefined)}
              placeholder="Enter user ID"
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              Leave as your own ID to send to yourself
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Notification Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Notification Body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Notification Type</label>
          <Select
            value={type}
            onValueChange={setType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={sendTestNotification} 
          disabled={isLoading || !title || !body}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </CardFooter>
    </Card>
  );
}