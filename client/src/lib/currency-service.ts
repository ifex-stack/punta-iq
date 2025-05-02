/**
 * Currency selection service based on user location with official exchange rates
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Exchange rate relative to USD
}

// Supported currencies with their symbols and exchange rates (as of May 2025)
// Updated with the latest official exchange rates
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
    rate: 0.79 // Updated May 2025 rate
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    flag: '🇪🇺', 
    rate: 0.92 // Updated May 2025 rate
  },
  NGN: { 
    code: 'NGN', 
    symbol: '₦', 
    name: 'Nigerian Naira', 
    flag: '🇳🇬', 
    rate: 1650 // Updated May 2025 rate
  },
  KES: { 
    code: 'KES', 
    symbol: 'KSh', 
    name: 'Kenyan Shilling', 
    flag: '🇰🇪', 
    rate: 133.75 // Updated May 2025 rate
  },
  ZAR: { 
    code: 'ZAR', 
    symbol: 'R', 
    name: 'South African Rand', 
    flag: '🇿🇦', 
    rate: 18.82 // Updated May 2025 rate 
  },
  GHS: { 
    code: 'GHS', 
    symbol: 'GH₵', 
    name: 'Ghanaian Cedi', 
    flag: '🇬🇭', 
    rate: 16.25 // Updated May 2025 rate
  },
  INR: { 
    code: 'INR', 
    symbol: '₹', 
    name: 'Indian Rupee', 
    flag: '🇮🇳', 
    rate: 83.72 // Updated May 2025 rate
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rate: 1.36 // Updated May 2025 rate
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rate: 1.51 // Updated May 2025 rate
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
  FI: 'EUR', // Finland
  EE: 'EUR', // Estonia
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  GR: 'EUR', // Greece
  MT: 'EUR', // Malta
  CY: 'EUR', // Cyprus
  
  // Africa
  NG: 'NGN', // Nigeria
  KE: 'KES', // Kenya
  ZA: 'ZAR', // South Africa
  GH: 'GHS', // Ghana
  EG: 'USD', // Egypt (using USD as fallback)
  MA: 'USD', // Morocco (using USD as fallback)
  TZ: 'USD', // Tanzania (using USD as fallback)
  
  // North America
  US: 'USD', // United States
  CA: 'CAD', // Canada
  MX: 'USD', // Mexico (using USD as common currency)
  
  // Oceania
  AU: 'AUD', // Australia
  NZ: 'AUD', // New Zealand (using AUD as an approximation)
  
  // Asia
  IN: 'INR', // India
  JP: 'USD', // Japan (using USD as fallback)
  CN: 'USD', // China (using USD as fallback)
  SG: 'USD', // Singapore (using USD as fallback)
  HK: 'USD', // Hong Kong (using USD as fallback)
  AE: 'USD', // UAE (using USD as fallback)
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
 * Format price with currency symbol based on locale conventions
 */
export function formatPrice(price: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  
  // Get appropriate locale for the currency
  let locale = 'en-US';
  
  switch (currency.code) {
    case 'GBP':
      locale = 'en-GB';
      break;
    case 'EUR':
      locale = 'de-DE'; // Using German locale for Euro
      break;
    case 'NGN':
      locale = 'en-NG';
      break;
    case 'KES':
      locale = 'en-KE';
      break;
    case 'ZAR':
      locale = 'en-ZA';
      break;
    case 'GHS':
      locale = 'en-GH';
      break;
    case 'INR':
      locale = 'en-IN';
      break;
    case 'CAD':
      locale = 'en-CA';
      break;
    case 'AUD':
      locale = 'en-AU';
      break;
  }
  
  // Format using Intl.NumberFormat for proper currency formatting
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Get all available currencies
 */
export function getAllCurrencies(): Currency[] {
  return Object.values(currencies);
}

// Cache user's selected currency
let userCurrency: Currency | null = null;

// Cache exchange rates with timestamp for freshness check
interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
}

let exchangeRateCache: ExchangeRateCache | null = null;

/**
 * Fetch real-time exchange rates from a public API
 * This ensures we always have the most up-to-date rates
 */
export async function fetchCurrentExchangeRates(): Promise<boolean> {
  try {
    // Check if cache is fresh (less than 24 hours old)
    const now = Date.now();
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (exchangeRateCache && (now - exchangeRateCache.timestamp < CACHE_TTL)) {
      // Cache is still fresh, no need to fetch new rates
      return true;
    }
    
    // Try to get from localStorage first
    const cachedRates = localStorage.getItem('exchangeRates');
    if (cachedRates) {
      const parsedCache = JSON.parse(cachedRates) as ExchangeRateCache;
      if (now - parsedCache.timestamp < CACHE_TTL) {
        exchangeRateCache = parsedCache;
        
        // Update the currencies with cached rates
        Object.keys(parsedCache.rates).forEach(code => {
          if (currencies[code]) {
            currencies[code].rate = parsedCache.rates[code];
          }
        });
        
        return true;
      }
    }
    
    // If no fresh cache, try to fetch from an API
    // Using ExchangeRate API which provides free access
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    const rates = data.rates;
    
    // Create a new cache
    exchangeRateCache = {
      rates,
      timestamp: now
    };
    
    // Save to localStorage
    localStorage.setItem('exchangeRates', JSON.stringify(exchangeRateCache));
    
    // Update the currency rates
    Object.keys(currencies).forEach(code => {
      if (rates[code]) {
        currencies[code].rate = rates[code];
      }
    });
    
    // Log that we've updated rates
    console.log('Updated exchange rates from API');
    
    return true;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Continue with hardcoded rates if API fails
    return false;
  }
}

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
  // Try to fetch current exchange rates (will use cache if available)
  await fetchCurrentExchangeRates();
  
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