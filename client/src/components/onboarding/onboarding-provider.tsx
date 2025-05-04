import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { PersonalizedOnboarding } from "./personalized-onboarding";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";

interface OnboardingContextType {
  showOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  
  // Fetch user preferences to determine if onboarding is completed
  const { data: preferences, isLoading } = useQuery<any>({
    queryKey: ["/api/user/preferences"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Track a flag for when onboarding was manually dismissed
  // Initialize from localStorage if available
  const [manuallyDismissed, setManuallyDismissed] = useState(() => {
    try {
      return localStorage.getItem('onboardingDismissed') === 'true';
    } catch (error) {
      return false;
    }
  });
  
  useEffect(() => {
    // If user is logged in and we have preferences data
    if (user && !isLoading) {
      // Check if onboarding was explicitly marked as completed in preferences
      if (preferences?.onboardingCompleted) {
        setHasCompletedOnboarding(true);
        return;
      }
      
      // Consider onboarding incomplete if no preferences are set
      // or if favoriteSports is empty
      const onboardingIncomplete = !preferences || 
        !preferences.favoriteSports || 
        preferences.favoriteSports.length === 0;
      
      setHasCompletedOnboarding(!onboardingIncomplete);
      
      // Auto show onboarding for new users, but only if not manually dismissed
      if (onboardingIncomplete && !isOpen && !manuallyDismissed) {
        // Small delay to ensure auth is fully loaded
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, preferences, isLoading, isOpen, manuallyDismissed]);
  
  // Listen for manual trigger to open onboarding
  useEffect(() => {
    const handleOpenOnboarding = () => setIsOpen(true);
    window.addEventListener('open-onboarding', handleOpenOnboarding);
    
    return () => {
      window.removeEventListener('open-onboarding', handleOpenOnboarding);
    };
  }, []);
  
  const showOnboarding = () => setIsOpen(true);
  
  const value = {
    showOnboarding,
    hasCompletedOnboarding,
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <PersonalizedOnboarding 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          
          // If dialog is closed by the user
          if (!open && user) {
            // Mark as manually dismissed to prevent auto-reappearing
            setManuallyDismissed(true);
            
            // Save this state to localStorage to persist across refreshes
            try {
              localStorage.setItem('onboardingDismissed', 'true');
            } catch (error) {
              console.error('Failed to save onboarding state to localStorage:', error);
            }
          }
        }} 
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Onboarding welcome banner to show on the homepage for users who haven't completed onboarding
export function OnboardingWelcomeBanner() {
  const { hasCompletedOnboarding, showOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  if (!user || hasCompletedOnboarding) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary-foreground/5 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" /> 
            Welcome to PuntaIQ!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your personalized onboarding to get tailored predictions for your favorite sports.
          </p>
        </div>
        <Button onClick={showOnboarding} size="sm" className="whitespace-nowrap">
          Complete Setup
        </Button>
      </div>
    </div>
  );
}

// Small persistent button that appears in the corner for users who haven't completed onboarding
export function OnboardingReminderButton() {
  const { hasCompletedOnboarding, showOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  if (!user || hasCompletedOnboarding) {
    return null;
  }
  
  return (
    <Button 
      onClick={showOnboarding} 
      size="sm" 
      className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg" 
      variant="default"
    >
      <Sparkle className="h-4 w-4 mr-2" /> Complete Setup
    </Button>
  );
}