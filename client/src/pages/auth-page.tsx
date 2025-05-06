import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Info, Trophy, BarChart2, Globe, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  // Handle registration submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
    });
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="w-full max-w-5xl animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Auth Forms */}
          <Card className="w-full shadow-lg border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">PuntaIQ</CardTitle>
              <CardDescription>
                Sign in or create an account to access AI-powered sports predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="login" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
                  <TabsTrigger value="login" className="text-sm font-medium">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-sm font-medium">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login" className="mt-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your password" 
                                type="password" 
                                {...field} 
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="text-right">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 font-normal h-auto" 
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : "Sign in"}
                      </Button>
                      
                      {/* Debug login for beta testing */}
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <Alert className="bg-muted/50">
                            <Info className="h-4 w-4" />
                            <AlertTitle className="flex items-center gap-2">
                              Beta Testing <Badge variant="outline" className="text-xs">Development Only</Badge>
                            </AlertTitle>
                            <AlertDescription className="pt-2">
                              Use these credentials for testing:
                              <div className="mt-2 font-mono text-xs bg-background p-2 rounded">
                                Username: beta_tester<br />
                                Password: puntaiq_beta_test
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 w-full text-xs"
                                onClick={() => {
                                  loginForm.setValue('username', 'beta_tester');
                                  loginForm.setValue('password', 'puntaiq_beta_test');
                                  loginMutation.mutate({
                                    username: 'beta_tester',
                                    password: 'puntaiq_beta_test'
                                  });
                                }}
                                disabled={loginMutation.isPending}
                              >
                                {loginMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Logging in...
                                  </>
                                ) : "Login as Beta Tester"}
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </form>
                  </Form>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register" className="mt-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Create a password" 
                                type="password" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              At least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Confirm your password" 
                                type="password" 
                                {...field} 
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : "Create account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground text-center w-full">
                By continuing, you agree to our{" "}
                <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.open("/legal/terms_and_conditions.md", "_blank")}>
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.open("/legal/privacy_policy.md", "_blank")}>
                  Privacy Policy
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Hero section - redesigned for mobile */}
          <div className="md:block hidden">
            <div className="w-full h-full relative overflow-hidden rounded-xl border shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20 z-0"></div>
              
              <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                    PuntaIQ
                  </h2>
                  <p className="text-xl font-medium mb-2">AI-Powered Sports Predictions</p>
                  <p className="text-muted-foreground mb-6">
                    Access expert predictions backed by advanced AI analytics
                  </p>
                
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm transition-all hover:scale-[1.02]">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <BarChart2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Advanced Analytics</h3>
                        <p className="text-sm text-muted-foreground">Thousands of data points analyzed per prediction</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm transition-all hover:scale-[1.02]">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Global Sports Coverage</h3>
                        <p className="text-sm text-muted-foreground">Football, basketball, tennis and more</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm transition-all hover:scale-[1.02]">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Premium Tiers</h3>
                        <p className="text-sm text-muted-foreground">Basic £7.99, Pro £14.99, Elite £29.99</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Join 50,000+ sports enthusiasts making smarter predictions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile features section - visible on mobile only */}
          <div className="md:hidden mt-6">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 bg-background p-3 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <BarChart2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">AI-Powered Analytics</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-background p-3 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Multiple Sports Coverage</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-background p-3 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Subscription Plans Available</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}