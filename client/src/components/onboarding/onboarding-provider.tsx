import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';

interface OnboardingState {
  showGuidedTour: boolean;
  showGettingStartedGuide: boolean;
  featureHighlights: string[];
  completedSteps: string[];
  currentStep: string | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  startGuidedTour: () => void;
  endGuidedTour: () => void;
  showGettingStarted: () => void;
  hideGettingStarted: () => void;
  markStepComplete: (step: string) => void;
  setCurrentStep: (step: string | null) => void;
  showFeatureHighlight: (featureId: string) => void;
  hideFeatureHighlight: (featureId: string) => void;
  hasCompletedStep: (step: string) => boolean;
}

const initialState: OnboardingState = {
  showGuidedTour: false,
  showGettingStartedGuide: false,
  featureHighlights: [],
  completedSteps: [],
  currentStep: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>(() => {
    // Load from localStorage if available
    const savedState = localStorage.getItem('puntaiq_onboarding');
    return savedState ? { ...initialState, ...JSON.parse(savedState) } : initialState;
  });
  
  const onboardingEnabled = useFeatureFlag('onboarding');
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('puntaiq_onboarding', JSON.stringify(state));
  }, [state]);
  
  // Check if user is new and show guided tour or getting started guide
  useEffect(() => {
    if (!onboardingEnabled) return;
    
    const isNewUser = !localStorage.getItem('puntaiq_user_visited');
    if (isNewUser) {
      localStorage.setItem('puntaiq_user_visited', 'true');
      
      // Determine whether to show tour or guide based on device and screen size
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setState(prev => ({ ...prev, showGettingStartedGuide: true }));
      } else {
        // Show guided tour after slight delay to let UI render first
        setTimeout(() => {
          setState(prev => ({ ...prev, showGuidedTour: true }));
        }, 2000);
      }
    }
  }, [onboardingEnabled]);
  
  const startGuidedTour = () => {
    setState(prev => ({ ...prev, showGuidedTour: true }));
  };
  
  const endGuidedTour = () => {
    setState(prev => ({ ...prev, showGuidedTour: false, currentStep: null }));
  };
  
  const showGettingStarted = () => {
    setState(prev => ({ ...prev, showGettingStartedGuide: true }));
  };
  
  const hideGettingStarted = () => {
    setState(prev => ({ ...prev, showGettingStartedGuide: false }));
  };
  
  const markStepComplete = (step: string) => {
    setState(prev => {
      if (prev.completedSteps.includes(step)) return prev;
      return { ...prev, completedSteps: [...prev.completedSteps, step] };
    });
  };
  
  const setCurrentStep = (step: string | null) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };
  
  const showFeatureHighlight = (featureId: string) => {
    setState(prev => {
      if (prev.featureHighlights.includes(featureId)) return prev;
      return { ...prev, featureHighlights: [...prev.featureHighlights, featureId] };
    });
  };
  
  const hideFeatureHighlight = (featureId: string) => {
    setState(prev => ({
      ...prev,
      featureHighlights: prev.featureHighlights.filter(id => id !== featureId)
    }));
  };
  
  const hasCompletedStep = (step: string) => {
    return state.completedSteps.includes(step);
  };
  
  const value = {
    state,
    startGuidedTour,
    endGuidedTour,
    showGettingStarted,
    hideGettingStarted,
    markStepComplete,
    setCurrentStep,
    showFeatureHighlight,
    hideFeatureHighlight,
    hasCompletedStep,
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