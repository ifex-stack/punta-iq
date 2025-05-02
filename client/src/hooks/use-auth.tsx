import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Complete User type that matches server response structure
// This ensures we handle all the properties correctly
type UserResponse = {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deviceImei: string | null;
  phoneNumber: string | null;
  isTwoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  referralCode: string;
  referredBy: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionTier: string;
  fantasyPoints: number;
  totalContestsWon: number;
  totalContestsEntered: number;
  referralStreak: number;
  lastReferralDate: string | null;
  lastLoginAt: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  userPreferences: {
    favoriteSports: number[];
    favoriteLeagues: number[];
    preferredTimeZone: string;
    theme: string;
    language: string;
    currency: string;
    bettingFrequency: string;
    predictionTypes: string[];
    riskTolerance: string;
    preferredOddsFormat: string;
    predictionsPerDay: number;
    experienceLevel: string;
    onboardingCompleted: boolean;
  };
  notificationSettings: {
    general: {
      predictions: boolean;
      results: boolean;
      promotions: boolean;
    };
    sports: {
      football: boolean;
      basketball: boolean;
      tennis: boolean;
      baseball: boolean;
      hockey: boolean;
      cricket: boolean;
      formula1: boolean;
      mma: boolean;
      volleyball: boolean;
      other: boolean;
    };
    metrics: {
      notificationCount: number;
      lastNotificationSent: Date;
      clickThroughRate: number;
      viewCount: number;
      clickCount: number;
      dismissCount: number;
    };
  };
  notificationToken: string | null;
  onboardingStatus: string;
  lastOnboardingStep: number;
};

type AuthContextType = {
  user: UserResponse | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserResponse, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

// Extending the insert schema for registration with email validation
const registerSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<UserResponse | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Increase staleTime to reduce unnecessary requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 60 * 1000, // Refresh session every 15 minutes
  });

  // Check session on mount and reconnect
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online - checking authentication status');
      refetch();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial check in case we have a session cookie but no user data
    if (!isLoading && !user) {
      refetch();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [refetch, isLoading, user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserResponse) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Also invalidate other queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      // Clear potentially stale user data on login failure
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: UserResponse) => {
      // Update auth data
      queryClient.setQueryData(["/api/user"], user);
      
      // Invalidate queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      // Ensure user is null on registration error
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all query cache that depends on authentication
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      // If logout fails, check if we're still authenticated
      refetch();
      
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
