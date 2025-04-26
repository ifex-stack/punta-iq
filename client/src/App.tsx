import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import StatsPage from "@/pages/stats-page";
import SubscriptionPage from "@/pages/subscription-page";
import ProfilePage from "@/pages/profile-page";
import FAQPage from "@/pages/faq-page";
import HistoricalDashboard from "@/pages/historical-dashboard";
import FantasyContestsPage from "@/pages/fantasy-contests-page";
import PredictionsPage from "@/pages/predictions-page";
import AdminPage from "@/pages/admin-page";
import { UIShowcase } from "@/components/ui-showcase";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from 'next-themes';
import { setNavigationState } from "./lib/error-handler";

// New components
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { GettingStartedGuide } from "@/components/onboarding/getting-started-guide";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { NotificationToastListener } from "@/components/notifications/notification-toast";
import { fetchFeatureFlags } from "./lib/feature-flags";

import AppLayout from "@/components/layout/app-layout";

// Create typed component definition to fix TypeScript errors
const Router: React.FC = () => {
  // Track location changes to know when we're navigating
  const [location] = useLocation();
  
  // Set navigation state when location changes
  useEffect(() => {
    // Mark that we're navigating (will suppress errors during this time)
    setNavigationState(true);
    
    // Clean up navigation flag after a delay
    const timeoutId = setTimeout(() => {
      setNavigationState(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [location]);
  
  // Don't wrap auth page in AppLayout to prevent showing the bottom navigation bar
  if (location === '/auth') {
    return (
      <div className="flex h-screen">
        <div className="flex-1 relative">
          <AuthPage />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <AppLayout>
          <Switch>
            <ProtectedRoute path="/" component={HomePage} />
            <ProtectedRoute path="/stats" component={StatsPage} />
            <ProtectedRoute path="/history" component={HistoricalDashboard} />
            <ProtectedRoute path="/predictions" component={PredictionsPage} />
            <ProtectedRoute path="/fantasy/contests" component={FantasyContestsPage} />
            <Route path="/fantasy" component={FantasyContestsPage} />
            <ProtectedRoute path="/subscription" component={SubscriptionPage} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/admin" component={AdminPage} />
            <Route path="/faq" component={FAQPage} />
            <Route path="/ui-showcase" component={UIShowcase} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
        
        {/* Positioned notification dropdown */}
        <div className="absolute top-4 right-4 z-50">
          <NotificationDropdown />
        </div>
        
        {/* Onboarding components (only shown when triggered) */}
        <GuidedTour />
        <GettingStartedGuide />
      </div>
    </div>
  );
}

function App() {
  // Fetch feature flags on app initialization
  useEffect(() => {
    fetchFeatureFlags()
      .then(() => console.log("Feature flags loaded"))
      .catch(err => console.error("Failed to load feature flags:", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <TooltipProvider>
          <AuthProvider>
            <NotificationProvider>
              <OnboardingProvider>
                <Toaster />
                <NotificationToastListener />
                <Router />
              </OnboardingProvider>
            </NotificationProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
