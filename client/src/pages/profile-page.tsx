import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { badgeTierEnum } from "@shared/schema";
import { subscriptionTiers } from "@shared/schema";
import { 
  User, 
  Bell, 
  Settings, 
  LogOut, 
  Shield, 
  TrendingUp, 
  Trophy,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeCollection } from "@/components/gamification/badge-collection";
import { LeaderboardSection } from "@/components/gamification/leaderboard-section";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  if (!user) {
    return null; // The ProtectedRoute will handle redirecting to login
  }
  
  // Get subscription tier display name
  const subscriptionDisplayName = 
    user.subscriptionTier === subscriptionTiers.FREE ? "Free" :
    user.subscriptionTier === subscriptionTiers.PREMIUM ? "Premium" :
    user.subscriptionTier === subscriptionTiers.PRO ? "Pro" : "Unknown";
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl bg-primary text-white">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="gap-1 py-1">
                <Shield className="h-3 w-3" />
                {subscriptionDisplayName}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="leaderboards">
            <TrendingUp className="h-4 w-4 mr-2" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Stats Overview
                </CardTitle>
                <CardDescription>Your activity on PuntaIQ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Fantasy Points</span>
                  <span className="font-semibold">{user.fantasyPoints || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Contests Won</span>
                  <span className="font-semibold">{user.totalContestsWon || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Contests Entered</span>
                  <span className="font-semibold">{user.totalContestsEntered || 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">
                    {user.totalContestsEntered 
                      ? `${Math.round((user.totalContestsWon / user.totalContestsEntered) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
                <CardDescription>Your latest badges and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground p-8">
                  Check out the Achievements tab to see your badges!
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <BadgeCollection />
        </TabsContent>
        
        <TabsContent value="leaderboards">
          <LeaderboardSection />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings 
                  settings={user.notificationSettings} 
                  userId={user.id} 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Subscription
                </CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-medium mb-1">Current Plan: {subscriptionDisplayName}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {user.subscriptionTier === subscriptionTiers.FREE 
                        ? "Upgrade to access premium predictions and features."
                        : "You have access to all premium features."}
                    </p>
                    
                    {user.subscriptionTier === subscriptionTiers.FREE && (
                      <Button>Upgrade Now</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationSettingsProps {
  settings: any;
  userId: number;
}

function NotificationSettings({ settings, userId }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(settings || {
    predictions: true,
    results: true,
    promotions: true
  });
  
  const handleToggleSetting = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/user/notification-settings", notificationSettings);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save notification settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-medium">Prediction Alerts</h3>
          <p className="text-sm text-muted-foreground">Get notified about new predictions</p>
        </div>
        <div>
          <Button 
            variant={notificationSettings.predictions ? "default" : "outline"}
            onClick={() => handleToggleSetting('predictions')}
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
          >
            {notificationSettings.promotions ? "On" : "Off"}
          </Button>
        </div>
      </div>
      
      <Button 
        className="w-full mt-4" 
        onClick={saveSettings}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}