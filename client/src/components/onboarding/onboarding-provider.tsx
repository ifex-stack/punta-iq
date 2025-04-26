import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';

type OnboardingStep = 'welcome' | 'predictions' | 'accumulators' | 'history' | 'profile' | 'subscription' | 'chatbot';

interface OnboardingContextType {
  // Onboarding state
  isOnboarded: boolean;
  isOnboardingActive: boolean;
  currentStep: OnboardingStep;
  
  // Onboarding controls
  startOnboarding: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Feature discovery
  hasSeenFeature: (featureId: string) => boolean;
  markFeatureAsSeen: (featureId: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Steps order for navigation
const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'predictions',
  'accumulators',
  'history',
  'profile',
  'subscription',
  'chatbot'
];

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const onboardingEnabled = useFeatureFlag('onboarding');
  
  // Check if user has completed onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('puntaiq_onboarded') === 'true';
    setIsOnboarded(onboardingCompleted);
    
    // Auto-start onboarding for new users if the feature is enabled
    if (onboardingEnabled && !onboardingCompleted) {
      const timer = setTimeout(() => {
        setIsOnboardingActive(true);
      }, 3000); // Give the app time to load before starting onboarding
      
      return () => clearTimeout(timer);
    }
  }, [onboardingEnabled]);
  
  // Start the onboarding process
  const startOnboarding = () => {
    setCurrentStep('welcome');
    setIsOnboardingActive(true);
  };
  
  // Skip the onboarding process
  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    localStorage.setItem('puntaiq_onboarded', 'true');
    setIsOnboarded(true);
  };
  
  // Mark onboarding as complete
  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    localStorage.setItem('puntaiq_onboarded', 'true');
    setIsOnboarded(true);
  };
  
  // Go to a specific step
  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };
  
  // Go to the next step
  const nextStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1]);
    } else {
      completeOnboarding();
    }
  };
  
  // Go to the previous step
  const previousStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1]);
    }
  };
  
  // Check if a feature has been seen before
  const hasSeenFeature = (featureId: string) => {
    return localStorage.getItem(`feature_seen_${featureId}`) === 'true';
  };
  
  // Mark a feature as seen
  const markFeatureAsSeen = (featureId: string) => {
    localStorage.setItem(`feature_seen_${featureId}`, 'true');
  };
  
  const value = {
    isOnboarded,
    isOnboardingActive,
    currentStep,
    startOnboarding,
    skipOnboarding,
    completeOnboarding,
    goToStep,
    nextStep,
    previousStep,
    hasSeenFeature,
    markFeatureAsSeen
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook for using the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}