import React, { createContext, useContext, useEffect, useState } from 'react';
import { Currency, getUserCurrency, setUserCurrency, getAllCurrencies, convertPrice, formatPrice } from '@/lib/currency-service';

interface CurrencyContextType {
  // Current active currency
  currency: Currency;
  // Loading state
  isLoading: boolean;
  // All available currencies
  availableCurrencies: Currency[];
  // Change the currency
  changeCurrency: (newCurrency: string | Currency) => void;
  // Convert price from USD to active currency
  convert: (priceInUSD: number) => number;
  // Format price with symbol
  format: (price: number) => string;
}

// Create context with default values
const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);

  // Initialize currency on component mount
  useEffect(() => {
    async function initialize() {
      try {
        // Get all available currencies
        const currencies = getAllCurrencies();
        setAvailableCurrencies(currencies);
        
        // Get user's preferred currency based on location or stored preference
        const userCurrency = await getUserCurrency();
        setCurrency(userCurrency);
      } catch (error) {
        console.error('Failed to initialize currency provider:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    initialize();
  }, []);

  // Change currency
  const changeCurrency = (newCurrency: string | Currency) => {
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
  };

  // Convert price from USD to the active currency
  const convert = (priceInUSD: number): number => {
    if (!currency) return priceInUSD;
    return convertPrice(priceInUSD, currency);
  };

  // Format price with currency symbol
  const format = (price: number): string => {
    if (!currency) return `$${price.toFixed(2)}`; // Fallback to USD
    return `${currency.symbol}${price.toFixed(2)}`;
  };

  // Provide default context while loading
  if (isLoading || !currency) {
    return (
      <CurrencyContext.Provider 
        value={{
          currency: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
          isLoading: true,
          availableCurrencies: [],
          changeCurrency: () => {},
          convert: (price) => price,
          format: (price) => `$${price.toFixed(2)}`,
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