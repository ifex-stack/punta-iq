import React, { useEffect, useState } from 'react';
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Check, MapPin, X } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { getCurrencyFromCountry } from '@/lib/currency-service';

interface CurrencyRecommendationProps {
  onDismiss: () => void;
  className?: string;
}

export function CurrencyRecommendation({ 
  onDismiss,
  className = ""
}: CurrencyRecommendationProps) {
  const { currency, changeCurrency } = useCurrency();
  const [location, setLocation] = useState<string | null>(null);
  const [recommendedCurrency, setRecommendedCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detect user's location on component mount
  useEffect(() => {
    async function detectLocation() {
      try {
        setLoading(true);
        
        // Make a request to the IP geolocation API
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to detect location');
        }
        
        const data = await response.json();
        const countryCode = data.country_code;
        const countryName = data.country_name;
        
        // Get the recommended currency for this country
        const recommended = getCurrencyFromCountry(countryCode);
        
        // Only recommend if it's different from current
        if (recommended.code !== currency.code) {
          setLocation(countryName);
          setRecommendedCurrency(recommended.code);
        } else {
          // If they already have the right currency, don't show recommendation
          onDismiss();
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        setError('Could not detect your location');
      } finally {
        setLoading(false);
      }
    }
    
    // Skip if user has explicitly chosen a currency (stored in localStorage)
    const hasExplicitlyChosen = localStorage.getItem('currencyExplicitlyChosen') === 'true';
    if (!hasExplicitlyChosen) {
      detectLocation();
    } else {
      onDismiss();
    }
  }, [currency.code, onDismiss]);
  
  // Accept the recommendation
  const handleAccept = () => {
    if (recommendedCurrency) {
      changeCurrency(recommendedCurrency);
      // Store that user has made an explicit choice
      localStorage.setItem('currencyExplicitlyChosen', 'true');
      onDismiss();
    }
  };
  
  // Dismiss and keep current currency
  const handleDismiss = () => {
    // Store that user has made an explicit choice
    localStorage.setItem('currencyExplicitlyChosen', 'true');
    onDismiss();
  };
  
  // Don't render anything if loading, already dismissed, or error
  if (loading || !recommendedCurrency || !location) {
    return null;
  }
  
  return (
    <Alert variant="default" className={`${className} border-primary/50 bg-primary/5 mb-4`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <AlertTitle className="flex items-center text-base font-medium">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            Currency recommendation for your region
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Based on your location ({location}), we recommend using {recommendedCurrency} as your currency. 
            Would you like to switch?
          </AlertDescription>
        </div>
        
        <div className="flex items-center space-x-2 mt-1 ml-4">
          <Button 
            size="sm" 
            variant="outline"
            className="border-muted-foreground/30 hover:border-muted-foreground/50"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4 mr-1" />
            No
          </Button>
          <Button 
            size="sm" 
            onClick={handleAccept}
          >
            <Check className="h-4 w-4 mr-1" />
            Yes
          </Button>
        </div>
      </div>
    </Alert>
  );
}