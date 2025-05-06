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
import HomePage from "@/pages/home-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
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
import MetricsPage from "@/pages/metrics-page";
import PrivacyPolicyPage from "@/pages/legal/privacy-policy";
import TermsOfServicePage from "@/pages/legal/terms-of-service";
import ResponsibleGamblingPage from "@/pages/legal/responsible-gambling";
import { UIShowcase } from "@/components/ui-showcase";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from 'next-themes';
import { setNavigationState } from "./lib/error-handler";
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
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          }>
            <Switch>
              <ProtectedRoute path="/" component={NewPredictionsAndStatsPage} />
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
              <Route path="/fantasy" component={FantasyContestsPage} />
              <ProtectedRoute path="/subscription" component={SubscriptionPage} />
              <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
              <ProtectedRoute path="/referrals" component={ReferralsPage} />
              <ProtectedRoute path="/gamification" component={GamificationPage} />
              <ProtectedRoute path="/admin" component={AdminPage} />
              <ProtectedRoute path="/analytics-dashboard" component={AnalyticsDashboardPage} />
              <ProtectedRoute path="/user-demographics" component={UserDemographicsPage} />
              <Route path="/historical-dashboard" component={HistoricalDashboard} />
              <ProtectedRoute path="/metrics" component={MetricsPage} />
              <Route path="/livescore" component={LiveScorePage} />
              <Route path="/ai-service-status" component={AIServiceStatusPage} />
              <Route path="/faq" component={FAQPage} />
              <Route path="/feedback" component={FeedbackPage} />
              <Route path="/legal/privacy-policy" component={PrivacyPolicyPage} />
              <Route path="/legal/terms-of-service" component={TermsOfServicePage} />
              <Route path="/legal/responsible-gambling" component={ResponsibleGamblingPage} />
              <Route path="/ui-showcase" component={UIShowcase} />
              <Route path="/login-test" component={React.lazy(() => import('./pages/login-test-page'))} />
              
              {/* Direct test page route - no auth required */}
              <Route path="/public-test">
                <div className="p-8 max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold mb-6">PuntaIQ Public Test Page</h1>
                  <p className="mb-4">This is a public test page that doesn't require authentication.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 hover:bg-gray-700 transition-colors">
                      <h2 className="text-xl font-semibold mb-2">API Status</h2>
                      <p>Check if the backend APIs are online and responding.</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white" 
                        onClick={() => window.location.href = '/api/ai-status'}
                      >
                        Check API Status
                      </button>
                    </div>
                    
                    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 hover:bg-gray-700 transition-colors">
                      <h2 className="text-xl font-semibold mb-2">Navigation Page</h2>
                      <p>Go to the navigation page with links to all sections.</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white" 
                        onClick={() => window.location.href = '/navigation'}
                      >
                        Visit Navigation
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 border border-green-600 rounded-lg bg-green-900/20">
                    <h2 className="text-xl font-semibold mb-2">React Application Working</h2>
                    <p>If you can see this page, the React application is working correctly.</p>
                  </div>
                </div>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </React.Suspense>
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

function App() {
  // Fetch feature flags on app initialization
  useEffect(() => {
    fetchFeatureFlags()
      .then(() => console.log("Feature flags loaded"))
      .catch(err => console.error("Failed to load feature flags:", err));
  }, []);

  // Add a direct navigation URL parameter check to bypass authentication and the providers for troubleshooting
  if (window.location.search.includes('showNav=true')) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">PuntaIQ Navigation</h1>
        <p className="mb-8">Use the links below to navigate to different parts of the application.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
            <h2 className="text-xl font-semibold mb-4">Main Pages</h2>
            <ul className="space-y-2">
              <li><a href="/auth" className="text-blue-400 hover:underline">Authentication Page</a></li>
              <li><a href="/predictions" className="text-blue-400 hover:underline">Predictions Page</a></li>
              <li><a href="/public-test" className="text-blue-400 hover:underline">Public Test Page</a></li>
              <li><a href="/historical-dashboard" className="text-blue-400 hover:underline">Historical Dashboard</a></li>
            </ul>
          </div>
          
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
            <h2 className="text-xl font-semibold mb-4">API Status</h2>
            <ul className="space-y-2">
              <li><a href="/api/ai-status" className="text-blue-400 hover:underline">AI Service Status</a></li>
              <li><a href="/api/predictions/football" className="text-blue-400 hover:underline">Football Predictions API</a></li>
              <li><a href="/api/predictions/basketball" className="text-blue-400 hover:underline">Basketball Predictions API</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-green-900/20 border border-green-600 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">React Application Working</h2>
          <p>If you can see this page, the React application is working correctly in direct navigation mode.</p>
        </div>
      </div>
    );
  }

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
