import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  User,
  Settings,
  Bell,
  CreditCard,
  LogOut,
  UserCheck,
  BadgeHelp,
  Mail,
  Shield,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Smartphone,
  Clock,
  Download,
  Trash2,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';

// Define types for subscription data
interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trial';
  currentPeriodEnd: string;
  paymentMethod?: {
    id: string;
    last4: string;
    brand: string;
  };
}

interface SubscriptionDetails {
  status: string;
  nextBilling: string | null;
  plan: string;
}

// Extended user interface with avatar field
interface ProfileUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export default function ProfilePage() {
  const { user: authUser, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  
  // Cast user to ProfileUser to handle avatar property
  const user = authUser as unknown as ProfileUser;
  
  // Prediction statistics data
  const predictionStats = {
    daily: {
      totalPredictions: 8,
      correctPredictions: 6,
      winRate: 75
    },
    weekly: {
      totalPredictions: 42,
      correctPredictions: 31,
      winRate: 73.8
    },
    monthly: {
      totalPredictions: 164,
      correctPredictions: 118,
      winRate: 72
    }
  };
  
  // Device access log data
  const deviceAccessLog = [
    { device: 'iPhone 12 Pro', location: 'London, UK', date: '2025-05-06 14:32', isCurrentDevice: true },
    { device: 'Chrome on Windows', location: 'Manchester, UK', date: '2025-05-05 09:21', isCurrentDevice: false },
    { device: 'Firefox on MacBook', location: 'Edinburgh, UK', date: '2025-05-02 18:45', isCurrentDevice: false }
  ];
  
  // User preferences states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };
  
  // Navigation
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Handle hash fragment for direct tab access
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['account', 'settings', 'subscription'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);
  
  // Update URL hash when tab changes
  useEffect(() => {
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);
  
  // Get user subscription info
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription,
    isError: isSubscriptionError
  } = useQuery({
    queryKey: ['/api/user/subscription'],
    enabled: !!user,
    retry: 1,
    retryDelay: 1000,
  });
  
  // Add fallback subscription for development
  const fallbackSubscription: Subscription = {
    id: 'sub_123456',
    planId: 'basic',
    status: 'active',
    currentPeriodEnd: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
    paymentMethod: {
      id: 'pm_123456',
      last4: '4242',
      brand: 'visa'
    }
  };
  
  // Format subscription details for display
  const getSubscriptionDetails = (): SubscriptionDetails => {
    try {
      if (!subscription) return { status: 'Free', nextBilling: null, plan: 'Free' };
      
      const planMap = {
        'basic': 'Basic',
        'pro': 'Pro',
        'elite': 'Elite',
      };
      
      // Use fallback subscription for development mode
      const typedSubscription = (subscription as any)?.planId ? 
        (subscription as Subscription) : fallbackSubscription;
      
      return {
        status: typedSubscription.status === 'active' ? 'Active' : 'Inactive',
        nextBilling: typedSubscription.currentPeriodEnd 
          ? format(new Date(typedSubscription.currentPeriodEnd), 'MMM d, yyyy')
          : null,
        plan: planMap[typedSubscription.planId as keyof typeof planMap] || 'Unknown'
      };
    } catch (error) {
      console.error('Error parsing subscription data:', error);
      return { status: 'Free', nextBilling: null, plan: 'Free' };
    }
  };
  
  // Toggle notification settings
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: any) => {
      // This would be an API call in a real app
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating your preferences",
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings
  const handleNotificationToggle = (setting: string, value: boolean) => {
    switch(setting) {
      case 'email':
        setEmailNotifications(value);
        break;
      case 'push':
        setPushNotifications(value);
        break;
      case 'marketing':
        setMarketingEmails(value);
        break;
    }
    
    updateNotificationsMutation.mutate({ [setting]: value });
  };
  
  // State for each expanded section
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Handle clicking on a section
  const handleSectionClick = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null); // collapse if clicking the same section
    } else {
      setExpandedSection(section); // expand the new section
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  const expandVariants = {
    collapsed: { height: 0, opacity: 0, padding: 0, margin: 0, overflow: 'hidden' },
    expanded: { 
      height: 'auto', 
      opacity: 1, 
      padding: '1rem',
      margin: '0.5rem 0 0 0',
      overflow: 'visible',
      transition: { duration: 0.3 }
    }
  };
  
  // Loading state
  if (!user) {
    return (
      <div className="pb-20 pt-4">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>
    );
  }
  
  const subDetails = getSubscriptionDetails();
  
  return (
    <div className="pb-20">
      {/* Header with user info */}
      <section className="mb-6 mt-2">
        <div className="flex items-center mb-6">
          <Avatar className="h-16 w-16 mr-4">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.username} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.username?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-xl font-bold mb-1">{user.username || 'User'}</h1>
            <p className="text-sm text-muted-foreground">{user.email || 'user@example.com'}</p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-2">
                {subDetails.plan}
              </Badge>
              {subDetails.status === 'Active' && (
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Tabs for different profile sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('account-details')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Account Details</h3>
                      <p className="text-xs text-muted-foreground">View and update your profile</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'account-details' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'account-details' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="flex">
                        <input 
                          id="username" 
                          value={user.username}
                          readOnly
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex">
                        <input 
                          id="email" 
                          value={user.email}
                          readOnly
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex">
                        <input 
                          id="phone" 
                          placeholder="Add your phone number"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full" size="sm">
                      Save Changes
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('notifications')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Notifications</h3>
                      <p className="text-xs text-muted-foreground">Manage notification preferences</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'notifications' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'notifications' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="game-start" className="text-sm font-medium">
                          Game Starts
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when your tracked games begin
                        </p>
                      </div>
                      <Switch id="game-start" checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="prediction-results" className="text-sm font-medium">
                          Prediction Results
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified about prediction outcomes
                        </p>
                      </div>
                      <Switch id="prediction-results" checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-contests" className="text-sm font-medium">
                          New Contests
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified about new fantasy contests
                        </p>
                      </div>
                      <Switch id="new-contests" checked={false} />
                    </div>
                    
                    <Button className="w-full" size="sm">
                      Save Preferences
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('email-preferences')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Email Preferences</h3>
                      <p className="text-xs text-muted-foreground">Manage email settings</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'email-preferences' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'email-preferences' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-digest" className="text-sm font-medium">
                          Weekly Digest
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive weekly summary of your predictions
                        </p>
                      </div>
                      <Switch id="weekly-digest" checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="tips-news" className="text-sm font-medium">
                          Tips & News
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get the latest news and prediction tips
                        </p>
                      </div>
                      <Switch id="tips-news" checked={false} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="account-updates" className="text-sm font-medium">
                          Account Updates
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Important information about your account
                        </p>
                      </div>
                      <Switch id="account-updates" checked={true} />
                    </div>
                    
                    <Button className="w-full" size="sm">
                      Update Email Settings
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('privacy-security')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Privacy & Security</h3>
                      <p className="text-xs text-muted-foreground">Manage security settings</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'privacy-security' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'privacy-security' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="flex">
                        <input 
                          id="current-password" 
                          type="password"
                          placeholder="Enter current password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="flex">
                        <input 
                          id="new-password" 
                          type="password"
                          placeholder="Enter new password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="flex">
                        <input 
                          id="confirm-password" 
                          type="password"
                          placeholder="Confirm new password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <Button className="w-full" size="sm">
                      Update Password
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('help-support')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <BadgeHelp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Help & Support</h3>
                      <p className="text-xs text-muted-foreground">Get assistance and FAQs</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'help-support' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'help-support' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Frequently Asked Questions</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium">How are predictions calculated?</h5>
                          <p className="text-xs text-muted-foreground">Our AI system analyzes historical data, player performance, and team stats to generate accurate predictions.</p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium">How do I cancel my subscription?</h5>
                          <p className="text-xs text-muted-foreground">You can cancel your subscription at any time from the Subscription tab in your profile settings.</p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium">How do I contact support?</h5>
                          <p className="text-xs text-muted-foreground">You can email us at support@puntaiq.com or use the in-app chat for assistance.</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full" size="sm">
                      Contact Support
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </motion.div>
            
            {/* PREDICTION STATS SECTION */}
            <motion.div variants={itemVariants} className="mt-4">
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('prediction-stats')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Prediction Statistics</h3>
                      <p className="text-xs text-muted-foreground">View your prediction performance</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'prediction-stats' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'prediction-stats' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-muted p-3 text-center">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Daily</h4>
                        <div className="text-2xl font-bold mb-1">
                          {predictionStats.daily.winRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {predictionStats.daily.correctPredictions}/{predictionStats.daily.totalPredictions} correct
                        </p>
                        <div className="mt-2 h-1 w-full bg-background overflow-hidden rounded-full">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ width: `${predictionStats.daily.winRate}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="rounded-lg bg-muted p-3 text-center">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Weekly</h4>
                        <div className="text-2xl font-bold mb-1">
                          {predictionStats.weekly.winRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {predictionStats.weekly.correctPredictions}/{predictionStats.weekly.totalPredictions} correct
                        </p>
                        <div className="mt-2 h-1 w-full bg-background overflow-hidden rounded-full">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ width: `${predictionStats.weekly.winRate}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="rounded-lg bg-muted p-3 text-center">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Monthly</h4>
                        <div className="text-2xl font-bold mb-1">
                          {predictionStats.monthly.winRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {predictionStats.monthly.correctPredictions}/{predictionStats.monthly.totalPredictions} correct
                        </p>
                        <div className="mt-2 h-1 w-full bg-background overflow-hidden rounded-full">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ width: `${predictionStats.monthly.winRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        View Detailed Stats
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            {/* DEVICE & ACCESS LOG SECTION */}
            <motion.div variants={itemVariants} className="mt-4">
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('device-access-log')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Device & Access Log</h3>
                      <p className="text-xs text-muted-foreground">Monitor your recent logins</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'device-access-log' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'device-access-log' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="space-y-3">
                      {deviceAccessLog.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                          <div className="flex items-center">
                            <div className="mr-3 p-1.5 rounded-full bg-background">
                              <Smartphone className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium">{log.device}</h5>
                                {log.isCurrentDevice && (
                                  <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">Current</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{log.location}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {log.date}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View All Devices
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            {/* DATA EXPORT SECTION */}
            <motion.div variants={itemVariants} className="mt-4">
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('data-export')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Data Export</h3>
                      <p className="text-xs text-muted-foreground">Download your prediction history</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'data-export' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'data-export' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Download your prediction history and performance analytics for your records.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        CSV Format
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        PDF Report
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
            
            {/* ACCOUNT DELETION SECTION */}
            <motion.div variants={itemVariants} className="mt-4">
              <Card className="p-4 cursor-pointer relative overflow-hidden" onClick={() => handleSectionClick('account-deletion')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 bg-red-100 p-2 rounded-full">
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-red-500">Delete Account</h3>
                      <p className="text-xs text-muted-foreground">Permanently delete your account</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSection === 'account-deletion' ? 'rotate-90' : ''}`} />
                </div>
                
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate={expandedSection === 'account-deletion' ? 'expanded' : 'collapsed'}
                  className="border-t mt-4"
                >
                  <div className="space-y-4 pt-4">
                    <div className="flex items-start p-3 bg-red-50 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-500">
                        Warning: This action is permanent and cannot be undone. All your data, predictions, and history will be permanently deleted.
                      </p>
                    </div>
                    
                    <Button variant="destructive" size="sm" className="w-full">
                      Delete Account
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-4">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates and predictions via email
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={emailNotifications} 
                      onCheckedChange={(value) => handleNotificationToggle('email', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="text-sm font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive alerts on your device
                      </p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={pushNotifications} 
                      onCheckedChange={(value) => handleNotificationToggle('push', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails" className="text-sm font-medium">
                        Marketing Emails
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive promotional offers and updates
                      </p>
                    </div>
                    <Switch 
                      id="marketing-emails" 
                      checked={marketingEmails}
                      onCheckedChange={(value) => handleNotificationToggle('marketing', value)} 
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-4">Display Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode" className="text-sm font-medium">
                        Dark Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <Switch 
                      id="dark-mode" 
                      checked={true} 
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}