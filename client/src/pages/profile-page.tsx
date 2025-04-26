import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/layout/top-bar";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRightIcon, 
  LogOutIcon,
  BellIcon,
  LockIcon,
  GlobeIcon,
  CrownIcon,
  HelpCircleIcon,
  BookOpenIcon,
  MailIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    predictions: user?.notificationSettings?.predictions || true,
    results: user?.notificationSettings?.results || true,
    promotions: user?.notificationSettings?.promotions || false
  });
  
  // Update notification settings
  const updateNotificationSettings = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      const res = await apiRequest("PATCH", "/api/user/notification-settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle notification toggle
  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    
    setNotificationSettings(newSettings);
    updateNotificationSettings.mutate(newSettings);
  };
  
  // Get avatar initials from username
  const getInitials = () => {
    if (!user?.username) return "";
    
    return user.username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get subscription display name
  const getSubscriptionName = () => {
    if (!user?.subscriptionTier) return "Free";
    
    switch (user.subscriptionTier) {
      case "basic":
        return "Basic";
      case "pro":
        return "Pro";
      case "elite":
        return "Elite";
      default:
        return "Free";
    }
  };
  
  // Get next payment date (mock data for MVP)
  const getNextPaymentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="pt-4 px-4">
          {/* User profile header */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mb-3">
              {getInitials()}
            </div>
            <h2 className="text-lg font-bold text-foreground">{user?.username}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="bg-primary bg-opacity-20 text-primary text-xs font-medium px-3 py-1 rounded-full mt-2">
              {getSubscriptionName()} Member
            </div>
          </div>
          
          {/* Account settings */}
          <Card className="rounded-xl mb-6">
            <h3 className="text-md font-bold text-foreground p-4 border-b border-border">Account Settings</h3>
            <div className="divide-y divide-border">
              {/* Notification settings */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-muted-foreground mr-2" />
                    <h4 className="text-foreground font-medium">Notification Settings</h4>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="predictions" className="text-sm text-foreground">New Predictions</Label>
                    <Switch 
                      id="predictions" 
                      checked={notificationSettings.predictions}
                      onCheckedChange={() => handleNotificationToggle('predictions')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="results" className="text-sm text-foreground">Prediction Results</Label>
                    <Switch 
                      id="results" 
                      checked={notificationSettings.results}
                      onCheckedChange={() => handleNotificationToggle('results')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="promotions" className="text-sm text-foreground">Promotions & Offers</Label>
                    <Switch 
                      id="promotions" 
                      checked={notificationSettings.promotions}
                      onCheckedChange={() => handleNotificationToggle('promotions')}
                    />
                  </div>
                </div>
              </div>
              
              {/* Change password */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <LockIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <h4 className="text-foreground font-medium">Change Password</h4>
                    <p className="text-xs text-muted-foreground">Update your security credentials</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Language */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <GlobeIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <h4 className="text-foreground font-medium">Language</h4>
                    <p className="text-xs text-muted-foreground">English (US)</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
          
          {/* Subscription info */}
          <Card className="rounded-xl mb-6">
            <h3 className="text-md font-bold text-foreground p-4 border-b border-border">Your Subscription</h3>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground font-medium">Current Plan</span>
                <span className="text-primary font-medium">{getSubscriptionName()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground font-medium">Billing Cycle</span>
                <span className="text-muted-foreground">Monthly</span>
              </div>
              
              {user?.subscriptionTier && user.subscriptionTier !== "free" && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground font-medium">Next Payment</span>
                    <span className="text-muted-foreground">{getNextPaymentDate()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-foreground font-medium">Amount</span>
                    <span className="text-muted-foreground">
                      ${user.subscriptionTier === "basic" ? "9.99" : user.subscriptionTier === "pro" ? "19.99" : "29.99"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="text-primary bg-primary bg-opacity-10">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="text-destructive bg-destructive bg-opacity-10">
                      Cancel Plan
                    </Button>
                  </div>
                </>
              )}
              
              {(!user?.subscriptionTier || user.subscriptionTier === "free") && (
                <div className="mt-2">
                  <Button 
                    className="w-full bg-primary"
                    onClick={() => window.location.href = "/subscription"}
                  >
                    <CrownIcon className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              )}
            </div>
          </Card>
          
          {/* Help and support */}
          <Card className="rounded-xl mb-6">
            <h3 className="text-md font-bold text-foreground p-4 border-b border-border">Help & Support</h3>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <HelpCircleIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <h4 className="text-foreground font-medium">Support Center</h4>
                    <p className="text-xs text-muted-foreground">Get help with your account</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <h4 className="text-foreground font-medium">FAQs</h4>
                    <p className="text-xs text-muted-foreground">Frequently asked questions</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <MailIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <h4 className="text-foreground font-medium">Contact Us</h4>
                    <p className="text-xs text-muted-foreground">Reach our support team</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
          
          <Button 
            variant="outline" 
            className="w-full py-3 text-foreground rounded-lg font-medium mb-6"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending 
              ? "Logging out..." 
              : (
                <>
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Log Out
                </>
              )
            }
          </Button>
          
          <div className="text-center text-xs text-muted-foreground mb-8">
            <p>AI Sports Predictions v1.0.3</p>
            <p className="mt-1">© 2023 AI Sports Predictions. All rights reserved.</p>
          </div>
        </div>
      </main>
      
      <BottomNavigation activePage="profile" />
    </div>
  );
}
