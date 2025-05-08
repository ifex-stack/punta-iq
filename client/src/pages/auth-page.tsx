import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to home page");
      window.location.href = '/';
    }
  }, [user]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Demo account functionality has been removed for security reasons
  
  // Handle login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Login attempt with:", data.username);
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Show a loading state and delay redirect to allow user to enjoy the transition
        const loadingToast = toast({
          title: "Preparing your dashboard",
          description: "Loading your personalized predictions...",
          duration: 3000,
        });
        
        // Delayed redirect after successful login to allow user to see the welcome message
        setTimeout(() => {
          // Use direct window.location.href instead of navigate to force a full page reload
          window.location.href = '/';
        }, 2500);
      },
      onError: (error) => {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: error.message || "Unable to login. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  // Handle register form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    
    console.log("Registration attempt with:", registerData.username);
    registerMutation.mutate(registerData, {
      onSuccess: (response: any) => {
        // Check if this requires manual login (handled in useAuth hook)
        if (response.loginStatus === 'manual_login_required') {
          // Auto switch to login tab
          setAuthTab('login');
          
          // Pre-fill the login form with their username
          loginForm.setValue('username', registerData.username);
          loginForm.setValue('password', ''); // Clear password field for security
          
          // Focus the password field
          setTimeout(() => {
            const passwordField = document.querySelector('input[name="password"]');
            if (passwordField) {
              (passwordField as HTMLInputElement).focus();
            }
          }, 300);
          
          return;
        }
        
        // Normal success flow
        toast({
          title: "Registration successful",
          description: "Your account has been created.",
        });
        
        // Show a loading state and delay redirect to allow user to enjoy the transition
        const loadingToast = toast({
          title: "Setting up your account",
          description: "Preparing your personalized experience...",
          duration: 3000,
        });
        
        // Delayed redirect after successful registration
        setTimeout(() => {
          // Use direct window.location.href instead of navigate to force a full page reload
          window.location.href = '/';
        }, 2500);
      },
      onError: (error) => {
        console.error("Registration error:", error);
        toast({
          title: "Registration failed",
          description: error.message || "Unable to create account. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2 
      }
    }
  };
  
  // If user is authenticated, don't render auth page
  if (user) return null;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-900/10 to-background pt-10 px-6">
      {/* App Logo/Branding */}
      <motion.div 
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="inline-block">
          <motion.div
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-600 mx-auto flex items-center justify-center shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              rotateZ: [0, 2, 0, -2, 0],
              y: [0, -2, 0, 2, 0] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="h-8 w-8 text-white drop-shadow-md" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-500">
          PuntaIQ
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-Powered Sports Predictions
        </p>
      </motion.div>
      
      {/* Auth Cards - Login/Register */}
      <motion.div
        className="flex-1 max-w-md w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Tabs
          value={authTab}
          onValueChange={(value) => setAuthTab(value as 'login' | 'register')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
            <TabsTrigger value="register" className="text-sm">Register</TabsTrigger>
          </TabsList>
          
          {/* Login Form */}
          <AnimatePresence mode="wait">
            {authTab === 'login' && (
              <TabsContent value="login" className="mt-0">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  key="login-form"
                >
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
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
                                    {...field}
                                    className="bg-background/50"
                                    placeholder="Enter your username"
                                    autoComplete="username"
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
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      className="bg-background/50 pr-10"
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Enter your password"
                                      autoComplete="current-password"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="pt-2 space-y-4">
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={loginMutation.isPending}
                            >
                              {loginMutation.isPending ? (
                                <span className="flex items-center">
                                  <motion.div
                                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
                                  Logging in...
                                </span>
                              ) : (
                                <>Login <ChevronRight className="ml-1 h-4 w-4" /></>
                              )}
                            </Button>
                            
                            {/* Demo account button has been removed */}
                            
                            {/* Quick login debug mode has been removed as requested */}
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}
            
            {/* Register Form */}
            {authTab === 'register' && (
              <TabsContent value="register" className="mt-0">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  key="register-form"
                >
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
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
                                    {...field}
                                    className="bg-background/50"
                                    placeholder="Choose a username"
                                    autoComplete="username"
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
                                    {...field}
                                    className="bg-background/50"
                                    type="email"
                                    placeholder="Enter your email"
                                    autoComplete="email"
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
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      className="bg-background/50 pr-10"
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Create a password"
                                      autoComplete="new-password"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
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
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      className="bg-background/50 pr-10"
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirm your password"
                                      autoComplete="new-password"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="pt-2">
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={registerMutation.isPending}
                            >
                              {registerMutation.isPending ? (
                                <span className="flex items-center">
                                  <motion.div
                                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
                                  Creating account...
                                </span>
                              ) : (
                                <>Create Account <ChevronRight className="ml-1 h-4 w-4" /></>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </motion.div>
      
      {/* App Features Showcase */}
      <motion.div 
        className="mt-8 mb-4 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-sm font-medium mb-4">Powerful AI Predictions</h2>
          <div className="flex flex-wrap justify-center gap-2 px-4 max-w-md mx-auto">
            {['Football', 'Basketball', 'Tennis', 'Volleyball', 'Hockey', 'Rugby', 'Baseball', 'Cricket', 'MMA'].map((sport, i) => (
              <motion.div 
                key={sport}
                className="px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (i * 0.05), duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sport}
              </motion.div>
            ))}
          </div>
          
          {/* Footer with legal links */}
          <div className="mt-8 text-xs text-muted-foreground">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-2">
              <span className="font-medium">Legal</span>
              <Link to="/legal/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/legal/responsible-gambling" className="hover:text-primary transition-colors">Responsible Gambling</Link>
              <span className="hover:text-primary transition-colors cursor-pointer">Support</span>
            </div>
            <p className="text-xs opacity-70">© 2025 PuntaIQ. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}