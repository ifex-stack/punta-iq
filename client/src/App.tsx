import { Route, Switch, useLocation } from "wouter";
import React, { useEffect, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationsProvider } from "@/hooks/use-notifications";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import ProfilePage from "@/pages/profile-page";
import FAQPage from "@/pages/faq-page";
import ReferralsPage from "@/pages/referrals-page";
import FeedbackPage from "@/pages/feedback";
import AccumulatorsPage from "@/pages/enhanced-accumulators-page";
import LiveScorePage from "@/pages/livescore-page";
import PrivacyPolicyPage from "@/pages/legal/privacy-policy";
import TermsOfServicePage from "@/pages/legal/terms-of-service";
import ResponsibleGamblingPage from "@/pages/legal/responsible-gambling";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from 'next-themes';
import { setNavigationState } from "./lib/error-handler";
import { CurrencyProvider } from "./hooks/use-currency";

// Mobile-specific components
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
  
  // Don't wrap auth page in AppLayout to prevent showing navigation bars
  if (location === '/auth') {
    return (
      <div className="flex h-screen">
        <div className="flex-1 relative">
          <AuthPage />
        </div>
      </div>
    );
  }
  
  // Only use mobile layout - this is a mobile-first/mobile-only application
  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        <MobileAppLayout>
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          }>
            <Switch>
              {/* Primary Mobile App Navigation */}
              <ProtectedRoute path="/" component={MobileHomePage} />
              <ProtectedRoute path="/explore" component={MobileExplorePage} />
              <ProtectedRoute path="/history" component={HistoryPage} />
              <ProtectedRoute path="/favorites" component={FavoritesPage} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/pricing" component={PricingPage} />
              
              {/* Secondary Mobile App Pages */}
              <ProtectedRoute path="/accumulators" component={AccumulatorsPage} />
              <Route path="/subscription" component={SubscriptionPage} />
              <Route path="/subscription-success" component={SubscriptionSuccessPage} />
              <ProtectedRoute path="/referrals" component={ReferralsPage} />
              <Route path="/livescore" component={LiveScorePage} />
              
              {/* Support & Legal Pages */}
              <Route path="/faq" component={FAQPage} />
              <Route path="/feedback" component={FeedbackPage} />
              <Route path="/legal/privacy-policy" component={PrivacyPolicyPage} />
              <Route path="/legal/terms-of-service" component={TermsOfServicePage} />
              <Route path="/legal/responsible-gambling" component={ResponsibleGamblingPage} />
              
              {/* Legacy Redirects */}
              <ProtectedRoute path="/predictions" component={MobileHomePage} />
              <ProtectedRoute path="/my-picks" component={FavoritesPage} />
              
              <Route component={NotFound} />
            </Switch>
          </React.Suspense>
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
