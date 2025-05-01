import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
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
import AccumulatorsPage from "@/pages/accumulators-page";
import NewsPage from "@/pages/news-page";
import PrivacyPolicyPage from "@/pages/legal/privacy-policy";
import TermsConditionsPage from "@/pages/legal/terms-conditions";
import ResponsibleGamblingPage from "@/pages/legal/responsible-gambling";
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
            <ProtectedRoute path="/" component={NewPredictionsAndStatsPage} />
            <ProtectedRoute path="/predictions" component={NewPredictionsAndStatsPage} />
            <ProtectedRoute path="/stats" component={NewPredictionsAndStatsPage} />
            <ProtectedRoute path="/predictions/advanced" component={AdvancedPredictionsPage} />
            <ProtectedRoute path="/advanced-analysis" component={AdvancedAnalysisPage} />
            <ProtectedRoute path="/accumulators" component={AccumulatorsPage} />
            <ProtectedRoute path="/fantasy/contests" component={FantasyContestsPage} />
            <ProtectedRoute path="/fantasy/contests/create" component={FantasyContestCreatePage} />
            <ProtectedRoute path="/fantasy/teams/:teamId/build" component={FantasyTeamBuildPage} />
            <ProtectedRoute path="/fantasy/player-comparison" component={PlayerComparisonPage} />
            <ProtectedRoute path="/fantasy/player-analysis" component={PlayerAnalysisPage} />
            <ProtectedRoute path="/fantasy/player-performance" component={PlayerPerformancePage} />
            <Route path="/fantasy" component={FantasyContestsPage} />
            <ProtectedRoute path="/subscription" component={SubscriptionPage} />
            <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/referrals" component={ReferralsPage} />
            <ProtectedRoute path="/gamification" component={GamificationPage} />
            <ProtectedRoute path="/admin" component={AdminPage} />
            <Route path="/news" component={NewsPage} />
            <Route path="/faq" component={FAQPage} />
            <Route path="/feedback" component={FeedbackPage} />
            <Route path="/legal/privacy-policy" component={PrivacyPolicyPage} />
            <Route path="/legal/terms-conditions" component={TermsConditionsPage} />
            <Route path="/legal/responsible-gambling" component={ResponsibleGamblingPage} />
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
      <ThemeProvider defaultTheme="system" enableSystem={true} attribute="class">
        <TooltipProvider>
          <AuthProvider>
            <NotificationsProvider>
              <NotificationProvider>
                <OnboardingProvider>
                  <Toaster />
                  <NotificationToastListener />
                  <Router />
                </OnboardingProvider>
              </NotificationProvider>
            </NotificationsProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
