import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Check, Send } from "lucide-react";

export function NotificationTestPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    title: 'Test Notification',
    body: 'This is a test notification from the admin panel',
    sport: 'football',
    type: 'system',
  });

  // Only admin users should access this component
  if (!user || user.id !== 1) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNotification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNotification((prev) => ({ ...prev, [name]: value }));
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/notifications/test", {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          sport: notification.sport,
        }
      });

      toast({
        title: "Notification Sent",
        description: "Test notification has been sent successfully",
        action: <Check className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sportOptions = [
    { label: "Football", value: "football" },
    { label: "Basketball", value: "basketball" },
    { label: "Tennis", value: "tennis" },
    { label: "Baseball", value: "baseball" },
    { label: "Hockey", value: "hockey" },
    { label: "Cricket", value: "cricket" },
    { label: "Formula 1", value: "formula1" },
    { label: "MMA", value: "mma" },
    { label: "Volleyball", value: "volleyball" },
    { label: "Other", value: "other" },
  ];

  const typeOptions = [
    { label: "Prediction", value: "prediction" },
    { label: "Result", value: "result" },
    { label: "Promotion", value: "promotion" },
    { label: "System", value: "system" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" /> Test Notifications
        </CardTitle>
        <CardDescription>
          Send test notifications to verify functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={notification.title}
            onChange={handleInputChange}
            placeholder="Notification title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            name="body"
            value={notification.body}
            onChange={handleInputChange}
            placeholder="Notification body text"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select 
              value={notification.sport} 
              onValueChange={(value) => handleSelectChange("sport", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={notification.type} 
              onValueChange={(value) => handleSelectChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          className="w-full mt-4" 
          onClick={sendTestNotification}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center">
              <Send className="mr-2 h-4 w-4" />
              Send Test Notification
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}