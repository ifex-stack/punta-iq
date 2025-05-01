import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { useAuth } from '@/hooks/use-auth';

export type TourStep = {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  spotlightRadius?: number;
  action?: () => void;
};

export type OnboardingContextType = {
  isTourVisible: boolean;
  isGuideVisible: boolean;
  isPersonalizedOnboardingVisible: boolean;
  currentTourStep: number;
  tourSteps: TourStep[];
  hasCompletedTour: boolean;
  hasCompletedGuide: boolean;
  hasCompletedPersonalizedOnboarding: boolean;
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  goToTourStep: (stepIndex: number) => void;
  openGuide: () => void;
  closeGuide: () => void;
  openPersonalizedOnboarding: () => void;
  closePersonalizedOnboarding: () => void;
  markTourCompleted: () => void;
  markGuideCompleted: () => void;
  markPersonalizedOnboardingCompleted: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the tour steps for the application
const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PuntaIQ',
    description: 'Let us show you around our platform and help you get the most out of our AI sports predictions.',
    targetSelector: 'body',
    placement: 'center',
    spotlightRadius: 0,
  },
  {
    id: 'predictions',
    title: 'Daily Predictions',
    description: 'Here you\'ll find the latest AI-generated predictions with confidence levels and odds for multiple sports.',
    targetSelector: '[data-tour="predictions"]',
    placement: 'bottom',
  },
  {
    id: 'accumulators',
    title: 'Accumulators',
    description: 'Our AI combines high-confidence predictions into accumulators with potential returns from 15x to 50x.',
    targetSelector: '[data-tour="accumulators"]',
    placement: 'bottom',
  },
  {
    id: 'stats',
    title: 'Historical Stats',
    description: 'Track our prediction performance and analyze success rates across different sports and markets.',
    targetSelector: '[data-tour="stats"]',
    placement: 'bottom',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Manage your account settings, subscription tiers, and set your notification preferences.',
    targetSelector: '[data-tour="profile"]',
    placement: 'left',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay updated with alerts about new predictions, special accumulators, and system announcements.',
    targetSelector: '[data-tour="notifications"]',
    placement: 'bottom',
  },
];

type OnboardingProviderProps = {
  children: ReactNode;
};

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [isPersonalizedOnboardingVisible, setIsPersonalizedOnboardingVisible] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>(DEFAULT_TOUR_STEPS);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    const stored = localStorage.getItem('puntaiq_tour_completed');
    return stored ? JSON.parse(stored) : false;
  });
  const [hasCompletedGuide, setHasCompletedGuide] = useState(() => {
    const stored = localStorage.getItem('puntaiq_guide_completed');
    return stored ? JSON.parse(stored) : false;
  });
  const [hasCompletedPersonalizedOnboarding, setHasCompletedPersonalizedOnboarding] = useState(() => {
    const stored = localStorage.getItem('puntaiq_personalized_onboarding_completed');
    return stored ? JSON.parse(stored) : false;
  });
  
  // Feature flags
  const onboardingEnabled = useFeatureFlag('onboarding');
  const gettingStartedGuideEnabled = useFeatureFlag('gettingStartedGuide');
  const personalizedOnboardingEnabled = useFeatureFlag('onboarding');
  
  // Auth context
  const { user } = useAuth();
  
  // Check if user has already completed personalized onboarding through the API
  const [hasApiCheckedOnboarding, setHasApiCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (personalizedOnboardingEnabled && user && !hasApiCheckedOnboarding) {
      // Check the API for onboarding status
      fetch('/api/user/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.onboardingCompleted) {
            setHasCompletedPersonalizedOnboarding(true);
            localStorage.setItem('puntaiq_personalized_onboarding_completed', JSON.stringify(true));
          }
          setHasApiCheckedOnboarding(true);
        })
        .catch(() => {
          // If there's an error, we'll just use the localStorage value
          setHasApiCheckedOnboarding(true);
        });
    }
  }, [personalizedOnboardingEnabled, user, hasApiCheckedOnboarding]);
  
  // Auto-start personalized onboarding for new users after checking API status
  useEffect(() => {
    if (personalizedOnboardingEnabled && user && hasApiCheckedOnboarding && !hasCompletedPersonalizedOnboarding && !isTourVisible && !isGuideVisible) {
      // Small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        openPersonalizedOnboarding();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [personalizedOnboardingEnabled, user, hasApiCheckedOnboarding, hasCompletedPersonalizedOnboarding, isTourVisible, isGuideVisible]);
  
  // Auto-start the tour for new users if enabled
  useEffect(() => {
    if (onboardingEnabled && user && hasCompletedPersonalizedOnboarding && !hasCompletedTour) {
      // Small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [onboardingEnabled, user, hasCompletedPersonalizedOnboarding, hasCompletedTour]);
  
  // Auto-open the getting started guide after tour completion
  useEffect(() => {
    if (gettingStartedGuideEnabled && hasCompletedTour && !hasCompletedGuide && !isTourVisible && !isPersonalizedOnboardingVisible) {
      // Small delay after tour completion
      const timer = setTimeout(() => {
        openGuide();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [gettingStartedGuideEnabled, hasCompletedTour, hasCompletedGuide, isTourVisible, isPersonalizedOnboardingVisible]);
  
  const startTour = () => {
    setCurrentTourStep(0);
    setIsTourVisible(true);
    setIsGuideVisible(false);
    setIsPersonalizedOnboardingVisible(false);
  };
  
  const endTour = () => {
    setIsTourVisible(false);
  };
  
  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(prev => prev + 1);
      // Execute any actions attached to the step
      if (tourSteps[currentTourStep + 1]?.action) {
        tourSteps[currentTourStep + 1].action?.();
      }
    } else {
      endTour();
      markTourCompleted();
    }
  };
  
  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
      // Execute any actions attached to the step
      if (tourSteps[currentTourStep - 1]?.action) {
        tourSteps[currentTourStep - 1].action?.();
      }
    }
  };
  
  const goToTourStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < tourSteps.length) {
      setCurrentTourStep(stepIndex);
      // Execute any actions attached to the step
      if (tourSteps[stepIndex]?.action) {
        tourSteps[stepIndex].action?.();
      }
    }
  };
  
  const openGuide = () => {
    setIsGuideVisible(true);
    setIsTourVisible(false);
    setIsPersonalizedOnboardingVisible(false);
  };
  
  const closeGuide = () => {
    setIsGuideVisible(false);
  };
  
  const openPersonalizedOnboarding = () => {
    setIsPersonalizedOnboardingVisible(true);
    setIsGuideVisible(false);
    setIsTourVisible(false);
  };
  
  const closePersonalizedOnboarding = () => {
    setIsPersonalizedOnboardingVisible(false);
  };
  
  const markTourCompleted = () => {
    setHasCompletedTour(true);
    localStorage.setItem('puntaiq_tour_completed', JSON.stringify(true));
  };
  
  const markGuideCompleted = () => {
    setHasCompletedGuide(true);
    localStorage.setItem('puntaiq_guide_completed', JSON.stringify(true));
  };
  
  const markPersonalizedOnboardingCompleted = () => {
    setHasCompletedPersonalizedOnboarding(true);
    localStorage.setItem('puntaiq_personalized_onboarding_completed', JSON.stringify(true));
  };
  
  const value = {
    isTourVisible,
    isGuideVisible,
    isPersonalizedOnboardingVisible,
    currentTourStep,
    tourSteps,
    hasCompletedTour,
    hasCompletedGuide,
    hasCompletedPersonalizedOnboarding,
    startTour,
    endTour,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    openGuide,
    closeGuide,
    openPersonalizedOnboarding,
    closePersonalizedOnboarding,
    markTourCompleted,
    markGuideCompleted,
    markPersonalizedOnboardingCompleted,
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
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