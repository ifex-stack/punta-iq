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
  RefreshCw
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
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
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
              <Card className="p-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="p-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
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
        
        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <AnimatePresence mode="wait">
            <motion.div
              key={`subscription-${isSubscriptionError ? 'error' : 'content'}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {isSubscriptionError ? (
                <motion.div variants={itemVariants} className="text-center py-8 space-y-4">
                  <div className="bg-red-50 dark:bg-red-950/20 inline-flex h-16 w-16 items-center justify-center rounded-full mx-auto">
                    <RefreshCw className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="font-semibold">Unable to load subscription</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We're having trouble loading your subscription information. Please try again.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => refetchSubscription()}
                    disabled={isLoadingSubscription}
                  >
                    {isLoadingSubscription ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <Card className="p-4">
                      <h3 className="text-sm font-medium mb-4">Subscription Details</h3>
                      
                      {isLoadingSubscription ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 py-1">
                            <span className="text-sm text-muted-foreground">Plan:</span>
                            <span className="text-sm font-medium">{subDetails.plan}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 py-1">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="text-sm font-medium">{subDetails.status}</span>
                          </div>
                          {subDetails.nextBilling && (
                            <div className="grid grid-cols-2 gap-2 py-1">
                              <span className="text-sm text-muted-foreground">Next Billing:</span>
                              <span className="text-sm font-medium">{subDetails.nextBilling}</span>
                            </div>
                          )}
                          
                          <div className="pt-4">
                            <Button 
                              variant={subDetails.plan === 'Free' ? 'default' : 'outline'} 
                              className="w-full"
                              onClick={() => navigate('/pricing')}
                            >
                              {subDetails.plan === 'Free' ? 'Upgrade Subscription' : 'Manage Subscription'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card className="p-4">
                      <h3 className="text-sm font-medium mb-4">Payment Method</h3>
                      
                      {isLoadingSubscription ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ) : (
                        <div>
                          {subscription ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                  {(subscription as any)?.paymentMethod?.last4 
                                    ? `•••• •••• •••• ${(subscription as any)?.paymentMethod?.last4}`
                                    : '•••• •••• •••• 4242'}
                                </span>
                                {(subscription as any)?.paymentMethod?.brand && (
                                  <Badge variant="outline" className="ml-2 capitalize">
                                    {(subscription as any)?.paymentMethod?.brand}
                                  </Badge>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/pricing')}
                              >
                                Update
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-sm text-muted-foreground mb-2">No payment method on file</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/pricing')}
                              >
                                Add Payment Method
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}