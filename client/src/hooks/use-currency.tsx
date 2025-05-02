import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { 
  Currency, 
  getUserCurrency, 
  setUserCurrency, 
  getAllCurrencies, 
  convertPrice, 
  formatPrice,
  fetchCurrentExchangeRates 
} from '@/lib/currency-service';

interface CurrencyContextType {
  // Current active currency
  currency: Currency;
  // Loading state
  isLoading: boolean;
  // All available currencies
  availableCurrencies: Currency[];
  // Change the currency
  changeCurrency: (newCurrency: string | Currency) => void;
  // Convert price from GBP to active currency
  convert: (priceInGBP: number) => number;
  // Format price with symbol
  format: (price: number) => string;
  // Force refresh of exchange rates from API
  refreshRates: () => Promise<boolean>;
  // Last update timestamp
  lastUpdated: Date | null;
}

// Create context with default values
const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Force refresh exchange rates from API
  const refreshRates = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Forcing refresh of exchange rates');
      const success = await fetchCurrentExchangeRates(true); // Pass true to force refresh
      if (success) {
        // Update available currencies with new rates
        const updatedCurrencies = getAllCurrencies();
        setAvailableCurrencies(updatedCurrencies);
        
        // Update current currency with new rate
        if (currency) {
          const updatedCurrency = updatedCurrencies.find(c => c.code === currency.code);
          if (updatedCurrency) {
            setCurrency(updatedCurrency);
            console.log(`Updated ${currency.code} rate to ${updatedCurrency.rate}`);
          }
        }
        
        // Update last updated timestamp
        setLastUpdated(new Date());
      }
      return success;
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      return false;
    }
  }, [currency]);

  // Initialize currency on component mount
  useEffect(() => {
    async function initialize() {
      try {
        // Force refresh to reset all rates to correct values
        await fetchCurrentExchangeRates(true);
        
        // After refreshing rates, get the user's currency
        const userCurrency = await getUserCurrency();
        
        // Get all available currencies with updated rates
        const currencies = getAllCurrencies();
        console.log('Available currencies with rates:', currencies);
        
        setAvailableCurrencies(currencies);
        setCurrency(userCurrency);
        
        // Set last updated timestamp
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to initialize currency provider:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    initialize();
  }, []);

  // Change currency
  const changeCurrency = useCallback((newCurrency: string | Currency) => {
    try {
      // Update the global currency setting
      setUserCurrency(newCurrency);
      
      // Update local state
      if (typeof newCurrency === 'string') {
        // Find currency object by code
        const currencyObj = availableCurrencies.find(c => c.code === newCurrency);
        if (currencyObj) {
          setCurrency(currencyObj);
        }
      } else {
        setCurrency(newCurrency);
      }
    } catch (error) {
      console.error('Failed to change currency:', error);
    }
  }, [availableCurrencies]);

  // Convert price from GBP to the active currency
  const convert = (priceInGBP: number): number => {
    if (!currency) return priceInGBP;
    return convertPrice(priceInGBP, currency);
  };

  // Format price with currency symbol using locale-aware formatting
  const format = (price: number): string => {
    if (!currency) return formatPrice(price, 'GBP'); // Fallback to GBP
    return formatPrice(price, currency.code);
  };

  // Provide default context while loading
  if (isLoading || !currency) {
    return (
      <CurrencyContext.Provider 
        value={{
          currency: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 1 },
          isLoading: true,
          availableCurrencies: [],
          changeCurrency: () => {},
          convert: (price) => price,
          format: (price) => formatPrice(price, 'GBP'),
          refreshRates: async () => false,
          lastUpdated: null
        }}
      >
        {children}
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        isLoading: false,
        availableCurrencies,
        changeCurrency,
        convert,
        format,
        refreshRates,
        lastUpdated
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}