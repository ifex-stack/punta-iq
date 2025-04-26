import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, CreditCard, LogOut, Save, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ProfilePage() {
  const [_, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
  });
  
  const { data: userPredictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ['/api/user-predictions'],
    enabled: !!user,
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-2">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.username} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user.displayName || user.username}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <Badge variant={user.subscriptionTier ? "default" : "outline"}>
                    {user.subscriptionTier || "Free Tier"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Saved Predictions</span>
                  <span className="text-sm">
                    {userPredictions?.length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Log Out"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="account">
                <UserIcon className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="subscription">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your account details and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notification Preferences</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage how you receive notifications about new predictions and results.
                      </p>
                      <div className="space-y-2">
                        {/* Notification preferences would go here */}
                        <p className="text-sm text-muted-foreground">
                          Notification preferences will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>
                    {user.subscriptionTier 
                      ? "Manage your current subscription plan and billing details." 
                      : "Subscribe to access premium predictions and features."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.subscriptionTier ? (
                    <div className="space-y-6">
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Current Plan</h4>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-lg font-bold text-primary">
                              {user.subscriptionTier} Plan
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Renews on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Payment Method</h4>
                        <div className="flex items-center gap-3 border rounded-lg p-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">•••• •••• •••• 4242</div>
                            <div className="text-xs text-muted-foreground">Expires 12/2026</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate("/subscription")}>
                          Change Plan
                        </Button>
                        <Button variant="outline" className="flex-1 text-destructive" onClick={() => {}}>
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You are currently on the free tier. Upgrade to a premium plan to 
                        access more predictions, advanced statistics, and exclusive features.
                      </p>
                      <Button onClick={() => navigate("/subscription")}>
                        View Subscription Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}