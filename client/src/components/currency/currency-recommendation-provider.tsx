import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyRecommendation } from './currency-recommendation';

interface CurrencyRecommendationContextType {
  showRecommendation: boolean;
  dismissRecommendation: () => void;
  resetRecommendation: () => void;
}

const CurrencyRecommendationContext = createContext<CurrencyRecommendationContextType | null>(null);

export function CurrencyRecommendationProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [showRecommendation, setShowRecommendation] = useState(false);
  
  // On first mount, check if the recommendation should be shown
  useEffect(() => {
    // Check if user has already been shown the recommendation
    const hasSeenRecommendation = localStorage.getItem('hasSeenCurrencyRecommendation') === 'true';
    
    // Only show recommendation if user hasn't seen it before
    if (!hasSeenRecommendation) {
      setShowRecommendation(true);
    }
  }, []);
  
  // Dismiss the recommendation
  const dismissRecommendation = () => {
    setShowRecommendation(false);
    // Mark that user has seen the recommendation
    localStorage.setItem('hasSeenCurrencyRecommendation', 'true');
  };
  
  // Reset the recommendation (used for testing or if user preferences change)
  const resetRecommendation = () => {
    localStorage.removeItem('hasSeenCurrencyRecommendation');
    localStorage.removeItem('currencyExplicitlyChosen');
    setShowRecommendation(true);
  };
  
  return (
    <CurrencyRecommendationContext.Provider 
      value={{ 
        showRecommendation, 
        dismissRecommendation,
        resetRecommendation
      }}
    >
      {children}
    </CurrencyRecommendationContext.Provider>
  );
}

export function useCurrencyRecommendation() {
  const context = useContext(CurrencyRecommendationContext);
  if (!context) {
    throw new Error('useCurrencyRecommendation must be used within a CurrencyRecommendationProvider');
  }
  return context;
}

// Helper component that will render the recommendation when needed
export function CurrencyRecommendationContainer() {
  const { showRecommendation, dismissRecommendation } = useCurrencyRecommendation();
  
  if (!showRecommendation) {
    return null;
  }
  
  return (
    <CurrencyRecommendation onDismiss={dismissRecommendation} />
  );
}