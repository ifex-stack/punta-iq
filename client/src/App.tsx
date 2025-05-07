import { Route, Switch, useLocation } from "wouter";
import React, { useEffect, Suspense, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import VerifyEmailPage from "@/pages/verify-email-page";
import ResetPasswordRequestPage from "@/pages/reset-password-request-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import ProfilePage from "@/pages/profile-page";
import FAQPage from "@/pages/faq-page";
import ReferralsPage from "@/pages/referrals-page";
import FeedbackPage from "@/pages/feedback";
import AccumulatorsPage from "@/pages/enhanced-accumulators-page";
import AIAccumulatorsPage from "@/pages/ai-accumulators-page";
import LiveScorePage from "@/pages/livescore-page";
import PrivacyPolicyPage from "@/pages/legal/privacy-policy";
import TermsOfServicePage from "@/pages/legal/terms-of-service";
import ResponsibleGamblingPage from "@/pages/legal/responsible-gambling";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from 'next-themes';
import { setNavigationState } from "./lib/error-handler";
import { CurrencyProvider } from "./hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";

// Mobile-specific components
import SplashScreen from "@/components/splash-screen";
import { OnboardingProvider, OnboardingReminderButton } from "@/components/onboarding/onboarding-provider";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { GettingStartedGuide } from "@/components/onboarding/getting-started-guide";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { NotificationToastListener } from "@/components/notifications/notification-toast";
import { CurrencyRecommendationProvider } from "@/components/currency/currency-recommendation-provider";
import { fetchFeatureFlags } from "./lib/feature-flags";

// Primary mobile app layout and pages
import MobileAppLayout from "@/components/layout/mobile-app-layout";
import MobileHomePage from "@/pages/mobile-home-page";
import MobileExplorePage from "@/pages/mobile-explore-page";
import HistoryPage from "@/pages/history-page";
import FavoritesPage from "@/pages/favorites-page";
import PricingPage from "@/pages/pricing-page";

// Create typed component definition to fix TypeScript errors
const Router: React.FC = () => {
  // Track location changes to know when we're navigating
  const [location] = useLocation();
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
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
  
  // Define pages that don't require authentication or navigation
  const authPages = ['/auth', '/verify-email', '/reset-password-request', '/reset-password'];
  
  // Render splash screen first, but not on auth-related pages
  if (showSplash && !authPages.includes(location)) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }
  
  // Display auth-related pages without the mobile layout
  if (authPages.includes(location)) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 relative">
          {location === '/auth' && <AuthPage />}
          {location === '/verify-email' && <VerifyEmailPage />}
          {location === '/reset-password-request' && <ResetPasswordRequestPage />}
          {location === '/reset-password' && <ResetPasswordPage />}
        </div>
      </div>
    );
  }
  
  // Check if the user is accessing with ?debug=true in URL to bypass login
  // This is only for development and testing purposes
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';

  if (debugMode && !user) {
    console.log("DEBUG MODE ACTIVATED - Bypassing authentication with direct beta login");
    // Create a debug login request when in debug mode
    // Send a more detailed console message for debugging
    fetch('/api/beta_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    .then(res => {
      console.log("Beta login response status:", res.status);
      if (!res.ok) {
        throw new Error(`Beta login failed with status: ${res.status}`);
      }
      return res.json();
    })
    .then(debugUser => {
      console.log("Auto-login as beta tester successful:", debugUser.username);
      console.log("User object:", debugUser);
      
      // Short delay to show the spinner and give a better loading experience
      setTimeout(() => {
        queryClient.setQueryData(["/api/user"], debugUser);
        // Remove the debug parameter from URL for cleaner experience
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('debug');
        window.history.replaceState({}, '', newUrl);
      }, 1500);
    })
    .catch(err => {
      console.error("Debug login failed:", err);
      // If debug login fails, try regular redirect to auth page
      window.location.href = '/auth';
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Debug Login</h2>
          <p className="text-sm text-muted-foreground">Logging in as beta tester automatically...</p>
        </div>
      </div>
    );
  }

  // Normal flow - if user is not logged in, redirect to auth page
  // But only if the current location is not already an auth-related page
  if (!user && !authPages.includes(location)) {
    window.location.href = '/auth';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Only use mobile layout - this is a mobile-first/mobile-only application
  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <MobileAppLayout>
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              }>
                <Switch>
                  {/* Primary Mobile App Navigation */}
                  <Route path="/" component={MobileHomePage} />
                  <Route path="/explore" component={MobileExplorePage} />
                  <Route path="/history" component={HistoryPage} />
                  <Route path="/favorites" component={FavoritesPage} />
                  <Route path="/profile" component={ProfilePage} />
                  <Route path="/pricing" component={PricingPage} />
                  
                  {/* Secondary Mobile App Pages */}
                  <Route path="/accumulators" component={AccumulatorsPage} />
                  <Route path="/ai-accumulators" component={AIAccumulatorsPage} />
                  <Route path="/subscription" component={SubscriptionPage} />
                  <Route path="/subscription-success" component={SubscriptionSuccessPage} />
                  <Route path="/referrals" component={ReferralsPage} />
                  <Route path="/livescore" component={LiveScorePage} />
                  
                  {/* Support & Legal Pages */}
                  <Route path="/faq" component={FAQPage} />
                  <Route path="/feedback" component={FeedbackPage} />
                  <Route path="/legal/privacy-policy" component={PrivacyPolicyPage} />
                  <Route path="/legal/terms-of-service" component={TermsOfServicePage} />
                  <Route path="/legal/responsible-gambling" component={ResponsibleGamblingPage} />
                  
                  {/* Legacy Redirects */}
                  <Route path="/predictions" component={MobileHomePage} />
                  <Route path="/my-picks" component={FavoritesPage} />
                  
                  <Route component={NotFound} />
                </Switch>
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </MobileAppLayout>
        
        {/* Mobile-optimized notifications and onboarding components */}
        <div className="fixed right-4 top-4 z-40 scale-90 origin-top-right">
          <NotificationDropdown />
        </div>
        <GuidedTour />
        <GettingStartedGuide />
        <OnboardingReminderButton />
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
                      <Router />
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
