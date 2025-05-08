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
import { UserResponse } from "@/types/user";

type AuthContextType = {
  user: UserResponse | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserResponse, Error, RegisterData>;
  verifyEmailMutation: UseMutationResult<{ message: string; code: string }, Error, { token: string }>;
  requestPasswordResetMutation: UseMutationResult<{ message: string; code: string }, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<{ message: string; code: string }, Error, { token: string; newPassword: string }>;
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
  // All of these fields are optional with defaults for registration
  emailVerificationToken: z.string().optional(),
  isEmailVerified: z.boolean().optional().default(false),
  deviceImei: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  isTwoFactorEnabled: z.boolean().optional().default(false),
  twoFactorSecret: z.string().optional().nullable(),
  referralCode: z.string().optional(),
  referredBy: z.number().optional().nullable(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
  subscriptionTier: z.string().optional().default("free"),
  notificationSettings: z.any().optional(),
  fantasyPoints: z.number().optional().default(0),
  totalContestsWon: z.number().optional().default(0),
  totalContestsEntered: z.number().optional().default(0),
  referralStreak: z.number().optional().default(0),
  lastReferralDate: z.date().optional().nullable(),
  onboardingStatus: z.enum(["not_started", "in_progress", "completed"]).optional().default("not_started"),
  lastOnboardingStep: z.number().optional().default(0),
  passwordResetToken: z.string().optional().nullable(),
  passwordResetExpires: z.date().optional().nullable(),
  notificationToken: z.string().optional().nullable(),
  userPreferences: z.any().optional()
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
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      
      // Check if this is a new user (first login) or returning user
      const isFirstLogin = user.createdAt && new Date(user.createdAt).toDateString() === new Date().toDateString();
      
      toast({
        title: isFirstLogin ? "Welcome to PuntaIQ!" : "Login successful",
        description: isFirstLogin 
          ? `Let's personalize your experience, ${user.username}!` 
          : `Welcome back, ${user.username}!`,
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
    onSuccess: (response: UserResponse & { loginStatus?: string; message?: string }) => {
      // Check if registration was successful but login failed
      if (response.loginStatus === 'manual_login_required') {
        // Store minimal user data but don't set as fully logged in
        queryClient.setQueryData(["/api/user"], null);
        
        toast({
          title: "Account created successfully",
          description: response.message || "Please log in with your new credentials.",
          duration: 5000,
        });
        
        // Return early to prevent showing welcome message
        return;
      }
      
      // Normal success flow - user is registered and logged in
      const user = response;
      
      // Update auth data
      queryClient.setQueryData(["/api/user"], user);
      
      // Invalidate queries that depend on auth
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      
      toast({
        title: "Registration successful",
        description: `Welcome to PuntaIQ, ${user.username}! Let's personalize your experience.`,
        duration: 5000,
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

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const res = await apiRequest("POST", "/api/verify-email", { token });
      return await res.json();
    },
    onSuccess: (data) => {
      // If user is logged in, refresh their data to update the isEmailVerified flag
      if (user) {
        refetch();
      }
      
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify your email. The link may be expired or invalid.",
        variant: "destructive",
      });
    },
  });

  // Password reset request mutation
  const requestPasswordResetMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/reset-password-request", { email });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset Link Sent",
        description: "If your email exists in our system, you will receive a password reset link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send reset request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/reset-password", { token, newPassword });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. The link may be expired or invalid.",
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
        verifyEmailMutation,
        requestPasswordResetMutation,
        resetPasswordMutation,
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
