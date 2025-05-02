/**
 * Currency selection service based on user location
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Exchange rate relative to USD
}

// Supported currencies with their symbols and exchange rates
const currencies: Record<string, Currency> = {
  USD: { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar', 
    flag: '🇺🇸', 
    rate: 1 
  },
  GBP: { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound', 
    flag: '🇬🇧', 
    rate: 0.79 
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    flag: '🇪🇺', 
    rate: 0.92 
  },
  NGN: { 
    code: 'NGN', 
    symbol: '₦', 
    name: 'Nigerian Naira', 
    flag: '🇳🇬', 
    rate: 1520 
  },
  KES: { 
    code: 'KES', 
    symbol: 'KSh', 
    name: 'Kenyan Shilling', 
    flag: '🇰🇪', 
    rate: 130.5 
  },
  ZAR: { 
    code: 'ZAR', 
    symbol: 'R', 
    name: 'South African Rand', 
    flag: '🇿🇦', 
    rate: 18.90 
  },
  GHS: { 
    code: 'GHS', 
    symbol: 'GH₵', 
    name: 'Ghanaian Cedi', 
    flag: '🇬🇭', 
    rate: 15.2 
  },
  INR: { 
    code: 'INR', 
    symbol: '₹', 
    name: 'Indian Rupee', 
    flag: '🇮🇳', 
    rate: 83.1 
  },
};

// Map country codes to currency codes
const countryToCurrencyMap: Record<string, string> = {
  // Europe
  GB: 'GBP', // United Kingdom
  IE: 'EUR', // Ireland
  FR: 'EUR', // France
  DE: 'EUR', // Germany
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  PT: 'EUR', // Portugal
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  LU: 'EUR', // Luxembourg
  AT: 'EUR', // Austria
  
  // Africa
  NG: 'NGN', // Nigeria
  KE: 'KES', // Kenya
  ZA: 'ZAR', // South Africa
  GH: 'GHS', // Ghana
  
  // Asia
  IN: 'INR', // India
  
  // Default
  US: 'USD', // United States
};

// Default currency code
const DEFAULT_CURRENCY = 'USD';

/**
 * Get currency based on country code
 */
export function getCurrencyFromCountry(countryCode: string): Currency {
  const currencyCode = countryToCurrencyMap[countryCode] || DEFAULT_CURRENCY;
  return currencies[currencyCode];
}

/**
 * Get currency by its code
 */
export function getCurrencyByCode(currencyCode: string): Currency {
  return currencies[currencyCode] || currencies[DEFAULT_CURRENCY];
}

/**
 * Convert price from USD to the specified currency
 */
export function convertPrice(priceInUSD: number, toCurrency: string | Currency): number {
  const currency = typeof toCurrency === 'string' 
    ? getCurrencyByCode(toCurrency) 
    : toCurrency;
  
  return parseFloat((priceInUSD * currency.rate).toFixed(2));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  
  return `${currency.symbol}${price.toFixed(2)}`;
}

/**
 * Get all available currencies
 */
export function getAllCurrencies(): Currency[] {
  return Object.values(currencies);
}

// Cache user's selected currency
let userCurrency: Currency | null = null;

/**
 * Set the user's preferred currency
 */
export function setUserCurrency(currency: Currency | string): void {
  if (typeof currency === 'string') {
    userCurrency = getCurrencyByCode(currency);
  } else {
    userCurrency = currency;
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('userCurrency', userCurrency.code);
}

/**
 * Get the user's preferred currency, falling back to location-based detection
 */
export async function getUserCurrency(): Promise<Currency> {
  // Return cached currency if available
  if (userCurrency) {
    return userCurrency;
  }
  
  // Check if currency is stored in localStorage
  const storedCurrency = localStorage.getItem('userCurrency');
  if (storedCurrency && currencies[storedCurrency]) {
    userCurrency = currencies[storedCurrency];
    return userCurrency;
  }
  
  try {
    // Attempt to detect country from IP using public API
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to detect location');
    }
    
    const data = await response.json();
    const detectedCountry = data.country_code;
    const currency = getCurrencyFromCountry(detectedCountry);
    
    // Cache the detected currency
    userCurrency = currency;
    localStorage.setItem('userCurrency', currency.code);
    
    return currency;
  } catch (error) {
    console.error('Failed to detect location-based currency:', error);
    // Fall back to default currency
    userCurrency = currencies[DEFAULT_CURRENCY];
    return userCurrency;
  }
}