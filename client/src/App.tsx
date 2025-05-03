import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import ProfilePage from "@/pages/profile-page";
import FAQPage from "@/pages/faq-page";
import HistoricalDashboard from "@/pages/historical-dashboard";
import FantasyContestsPage from "@/pages/fantasy-contests-page";
import FantasyContestCreatePage from "@/pages/fantasy-contest-create-page";
import FantasyTeamBuildPage from "@/pages/fantasy-team-build-page";
import NewPredictionsAndStatsPage from "@/pages/new-predictions-and-stats-page";
import AdvancedPredictionsPage from "@/pages/advanced-predictions-page";
import PlayerComparisonPage from "@/pages/player-comparison-page";
import PlayerAnalysisPage from "@/pages/player-analysis-page";
import PlayerPerformancePage from "@/pages/player-performance-page";
import ReferralsPage from "@/pages/referrals-page";
import GamificationPage from "@/pages/gamification-page";
import AdminPage from "@/pages/admin-page";
import FeedbackPage from "@/pages/feedback";
import AdvancedAnalysisPage from "@/pages/advanced-analysis-page";
import AccumulatorsPage from "@/pages/enhanced-accumulators-page"; // Using enhanced version with animations and improved UX
import LiveScorePage from "@/pages/livescore-page";
import AIServiceStatusPage from "@/pages/ai-service-status-page";
import TieredPredictionsPage from "@/pages/tiered-predictions-page"; // New tiered predictions page
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import UserDemographicsPage from "@/pages/user-demographics-page";
import PrivacyPolicyPage from "@/pages/legal/privacy-policy";
import TermsOfServicePage from "@/pages/legal/terms-of-service";
import ResponsibleGamblingPage from "@/pages/legal/responsible-gambling";
import { UIShowcase } from "@/components/ui-showcase";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from 'next-themes';
import { setNavigationState, attemptRouteRecovery } from "./lib/error-handler";
import { CurrencyProvider } from "./hooks/use-currency";

// New components
import { OnboardingProvider, OnboardingReminderButton } from "@/components/onboarding/onboarding-provider";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { GettingStartedGuide } from "@/components/onboarding/getting-started-guide";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { NotificationToastListener } from "@/components/notifications/notification-toast";
import { CurrencyRecommendationProvider, CurrencyRecommendationContainer } from "@/components/currency/currency-recommendation-provider";
import { fetchFeatureFlags } from "./lib/feature-flags";

import AppLayout from "@/components/layout/app-layout";

// Create typed component definition to fix TypeScript errors
const Router: React.FC = () => {
  // Track location changes to know when we're navigating
  const [location] = useLocation();
  
  // Debug location - useful for troubleshooting routing issues
  useEffect(() => {
    console.log(`Current location: ${location}`);
    console.log(`Current URL: ${window.location.href}`);
    
    // Check if we're on the root path and create a visible flag for debugging
    if (location === '/') {
      console.log('PuntaIQ: At root path - rendering main application components');
      
      // Add a flag to help with debugging and ensure we're at the right location
      document.documentElement.dataset.puntalocation = 'root';
    }
  }, [location]);
  
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
  
  // Enhanced 404 recovery mechanism using our centralized recovery function
  useEffect(() => {
    const handleLocationChange = () => {
      // If we're at a 404 page from the server but we have an SPA route for it
      // force a re-render by using the route recovery utility
      if ((document.title.includes('404') || document.body.textContent?.includes('Not Found')) && 
          location !== '/not-found') {
        console.log('Detected 404 page - attempting route recovery via utility');
        
        // Use our centralized recovery function
        attemptRouteRecovery(window.location.pathname);
        
        // Force a refresh after a short delay if we're still seeing a 404
        setTimeout(() => {
          if (document.title.includes('404') || document.body.textContent?.includes('Not Found')) {
            console.log('Still on 404 page after recovery attempt - forcing navigation to root');
            window.location.href = `${window.location.protocol}//${window.location.hostname}:3000/`;
          }
        }, 1500);
      }
    };
    
    // Run once on mount
    handleLocationChange();
    
    // Also listen for navigation events to trigger recovery if needed
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('navigate', handleLocationChange);
    window.addEventListener('load', handleLocationChange);
    
    // Set up global error handler for navigation errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('navigation') || event.error.message.includes('404'))) {
        console.log('Navigation error detected:', event.error.message);
        attemptRouteRecovery(window.location.pathname);
        // Prevent default error handling
        event.preventDefault();
      }
    };
    
    // Add the error handler
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange);
      window.removeEventListener('load', handleLocationChange);
      window.removeEventListener('error', handleError);
    };
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
  
  // Add app debug info for troubleshooting
  console.log(`Current app state: location=${location}, port=${window.location.port}, hostname=${window.location.hostname}`);
  
  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <AppLayout>
          <Switch>
            {/* Public landing page to ensure initial loading works */}
            <Route path="/" component={HomePage} />
            
            {/* Protected routes requiring authentication */}
            <ProtectedRoute path="/predictions" component={NewPredictionsAndStatsPage} />
            <ProtectedRoute path="/stats" component={NewPredictionsAndStatsPage} />
            <ProtectedRoute path="/predictions/advanced" component={AdvancedPredictionsPage} />
            <ProtectedRoute path="/advanced-analysis" component={AdvancedAnalysisPage} />
            <ProtectedRoute path="/accumulators" component={AccumulatorsPage} />
            <ProtectedRoute path="/predictions/tiered" component={TieredPredictionsPage} />
            <ProtectedRoute path="/fantasy/contests" component={FantasyContestsPage} />
            <ProtectedRoute path="/fantasy/contests/create" component={FantasyContestCreatePage} />
            <ProtectedRoute path="/fantasy/teams/:teamId/build" component={FantasyTeamBuildPage} />
            <ProtectedRoute path="/fantasy/player-comparison" component={PlayerComparisonPage} />
            <ProtectedRoute path="/fantasy/player-analysis" component={PlayerAnalysisPage} />
            <ProtectedRoute path="/fantasy/player-performance" component={PlayerPerformancePage} />
            <ProtectedRoute path="/fantasy" component={FantasyContestsPage} />
            <ProtectedRoute path="/subscription" component={SubscriptionPage} />
            <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/referrals" component={ReferralsPage} />
            <ProtectedRoute path="/gamification" component={GamificationPage} />
            <ProtectedRoute path="/admin" component={AdminPage} />
            <ProtectedRoute path="/analytics-dashboard" component={AnalyticsDashboardPage} />
            <ProtectedRoute path="/user-demographics" component={UserDemographicsPage} />
            
            {/* Public routes accessible without authentication */}
            <Route path="/livescore" component={LiveScorePage} />
            <Route path="/ai-service-status" component={AIServiceStatusPage} />
            <Route path="/faq" component={FAQPage} />
            <Route path="/feedback" component={FeedbackPage} />
            <Route path="/legal/privacy-policy" component={PrivacyPolicyPage} />
            <Route path="/legal/terms-of-service" component={TermsOfServicePage} />
            <Route path="/legal/responsible-gambling" component={ResponsibleGamblingPage} />
            <Route path="/ui-showcase" component={UIShowcase} />
            <Route path="/not-found" component={NotFound} />
            <Route path="/:path" component={NotFound} />
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
        <OnboardingReminderButton />
      </div>
    </div>
  );
}

// Custom location hook for Wouter to ensure proper routing
// Type annotation fixes TypeScript error with Wouter's BaseLocationHook
const useCustomLocation = (): [string, (to: string, ...args: any[]) => void] => {
  // Use state to force re-renders when needed
  const [location, setLocation] = useState(() => window.location.pathname);
  
  // Debug initial location
  useEffect(() => {
    console.log(`Initial location hook path: ${window.location.pathname}`);
    console.log(`Initial URL: ${window.location.href}`);
    
    // Handle case where we might be on a different port (development server vs. application server)
    if (window.location.port !== '3000' && process.env.NODE_ENV === 'development') {
      console.log('Development port mismatch detected - using client-side routing');
    }
  }, []);
  
  useEffect(() => {
    // Listen for history changes
    const handleLocationChange = () => {
      console.log(`Location change detected: ${window.location.pathname}`);
      setLocation(window.location.pathname);
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);
    
    // Also listen for hashchange events in case we're using those
    window.addEventListener('hashchange', handleLocationChange);
    
    // Fix for direct URL navigation using our centralized recovery function
    const fixNonExistentRoutes = () => {
      if (document.title.includes('404') || document.body.textContent?.includes('Not Found')) {
        console.log('404 page detected in location hook - attempting SPA recovery');
        // Use our centralized recovery function
        attemptRouteRecovery(window.location.pathname);
        // Update the location state to match current path
        setLocation(window.location.pathname);
      }
    };
    
    // Check once on mount with a slight delay to ensure page has loaded
    setTimeout(fixNonExistentRoutes, 300);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  
  // Return current path and a function to navigate
  // Fix TypeScript error by making this compatible with the BaseLocationHook type
  return [
    location,
    (to: string, ...args: any[]) => {
      console.log(`Navigation requested to: ${to}`);
      
      // Handle relative URLs
      if (to.startsWith('/')) {
        // Ensure we're navigating to the right port in development
        if (window.location.port !== '3000' && process.env.NODE_ENV === 'development') {
          const baseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
          console.log(`Cross-port navigation to: ${baseUrl}${to}`);
          window.location.href = `${baseUrl}${to}`;
          return;
        }
      }
      
      // Standard navigation
      console.log(`Standard navigation to: ${to}`);
      window.history.pushState(null, '', to);
      setLocation(to);
    }
  ];
};

function App() {
  // Fetch feature flags on app initialization
  useEffect(() => {
    fetchFeatureFlags()
      .then(() => console.log("Feature flags loaded"))
      .catch(err => console.error("Failed to load feature flags:", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem={true} attribute="class">
        <TooltipProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CurrencyRecommendationProvider>
                <NotificationsProvider>
                  <NotificationProvider>
                    <OnboardingProvider>
                      <Toaster />
                      <NotificationToastListener />
                      {/* Use our custom router with fixed location handling */}
                      <WouterRouter hook={useCustomLocation}>
                        <Router />
                      </WouterRouter>
                    </OnboardingProvider>
                  </NotificationProvider>
                </NotificationsProvider>
              </CurrencyRecommendationProvider>
            </CurrencyProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
