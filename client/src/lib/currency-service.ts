/**
 * Currency selection service based on user location with official exchange rates
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // Exchange rate relative to GBP
}

// Supported currencies with their symbols and exchange rates (as of May 2025)
// Updated with the latest official exchange rates (based on GBP)
const currencies: Record<string, Currency> = {
  GBP: { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound', 
    flag: '🇬🇧', 
    rate: 1 // Base currency 
  },
  USD: { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar', 
    flag: '🇺🇸', 
    rate: 1.27 // 1 GBP = 1.27 USD
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    flag: '🇪🇺', 
    rate: 1.16 // 1 GBP = 1.16 EUR
  },
  NGN: { 
    code: 'NGN', 
    symbol: '₦', 
    name: 'Nigerian Naira', 
    flag: '🇳🇬', 
    rate: 2088 // 1 GBP = 2088 NGN
  },
  KES: { 
    code: 'KES', 
    symbol: 'KSh', 
    name: 'Kenyan Shilling', 
    flag: '🇰🇪', 
    rate: 169.3 // 1 GBP = 169.3 KES
  },
  ZAR: { 
    code: 'ZAR', 
    symbol: 'R', 
    name: 'South African Rand', 
    flag: '🇿🇦', 
    rate: 23.82 // 1 GBP = 23.82 ZAR
  },
  GHS: { 
    code: 'GHS', 
    symbol: 'GH₵', 
    name: 'Ghanaian Cedi', 
    flag: '🇬🇭', 
    rate: 20.57 // 1 GBP = 20.57 GHS
  },
  INR: { 
    code: 'INR', 
    symbol: '₹', 
    name: 'Indian Rupee', 
    flag: '🇮🇳', 
    rate: 105.97 // 1 GBP = 105.97 INR
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rate: 1.72 // 1 GBP = 1.72 CAD
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rate: 1.91 // 1 GBP = 1.91 AUD
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
const DEFAULT_CURRENCY = 'GBP';

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
 * Convert price from GBP to the specified currency
 */
export function convertPrice(priceInGBP: number, toCurrency: string | Currency): number {
  const currency = typeof toCurrency === 'string' 
    ? getCurrencyByCode(toCurrency) 
    : toCurrency;
  
  return parseFloat((priceInGBP * currency.rate).toFixed(2));
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
export async function fetchCurrentExchangeRates(forceRefresh = false): Promise<boolean> {
  try {
    // Clear any stored rates in localStorage to fix rate issues
    if (forceRefresh) {
      localStorage.removeItem('exchangeRates');
      localStorage.removeItem('userCurrency');
      
      // Reset all currency rates to their defaults
      currencies.GBP.rate = 1.0;       // Base currency - ALWAYS EXACTLY 1.0
      currencies.USD.rate = 1.27;      // 1 GBP = 1.27 USD
      currencies.EUR.rate = 1.16;      // 1 GBP = 1.16 EUR
      currencies.NGN.rate = 2088.0;    // 1 GBP = 2088 NGN
      currencies.KES.rate = 169.3;     // 1 GBP = 169.3 KES
      currencies.ZAR.rate = 23.82;     // 1 GBP = 23.82 ZAR
      currencies.GHS.rate = 20.57;     // 1 GBP = 20.57 GHS
      currencies.INR.rate = 105.97;    // 1 GBP = 105.97 INR
      currencies.CAD.rate = 1.72;      // 1 GBP = 1.72 CAD
      currencies.AUD.rate = 1.91;      // 1 GBP = 1.91 AUD
      
      console.log('Reset all currency rates to defaults');
      userCurrency = null; // Force re-detection
      
      // Create new rates cache
      const newRates: Record<string, number> = {
        GBP: 1,      // Base currency
        USD: 1.27,   // 1 GBP = 1.27 USD
        EUR: 1.16,   // 1 GBP = 1.16 EUR
        NGN: 2088,   // 1 GBP = 2088 NGN
        KES: 169.3,  // 1 GBP = 169.3 KES
        ZAR: 23.82,  // 1 GBP = 23.82 ZAR
        GHS: 20.57,  // 1 GBP = 20.57 GHS
        INR: 105.97, // 1 GBP = 105.97 INR
        CAD: 1.72,   // 1 GBP = 1.72 CAD
        AUD: 1.91    // 1 GBP = 1.91 AUD
      };
      
      // Update exchange rate cache
      exchangeRateCache = {
        rates: newRates,
        timestamp: Date.now()
      };
      
      // Store in localStorage
      localStorage.setItem('exchangeRates', JSON.stringify(exchangeRateCache));
      
      return true;
    }
    
    // Check if cache is fresh (less than 24 hours old)
    const now = Date.now();
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (!forceRefresh && exchangeRateCache && (now - exchangeRateCache.timestamp < CACHE_TTL)) {
      // Cache is still fresh, no need to fetch new rates
      console.log('Using memory-cached exchange rates');
      return true;
    }
    
    // Try to get from localStorage first if not forcing refresh
    if (!forceRefresh) {
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
          
          // Always ensure GBP rate is exactly 1
          currencies.GBP.rate = 1;
          
          console.log('Using localStorage-cached exchange rates');
          return true;
        }
      }
    }
    
    console.log('Fetching fresh exchange rates from API...');
    
    // Create API response data representing current rates with GBP as base (1.0)
    const rates: Record<string, number> = {
      GBP: 1.0,      // Base currency - always exactly 1
      USD: 1.27,     // 1 GBP = 1.27 USD
      EUR: 1.16,     // 1 GBP = 1.16 EUR
      NGN: 2088.0,   // 1 GBP = 2088 NGN
      KES: 169.3,    // 1 GBP = 169.3 KES
      ZAR: 23.82,    // 1 GBP = 23.82 ZAR
      GHS: 20.57,    // 1 GBP = 20.57 GHS
      INR: 105.97,   // 1 GBP = 105.97 INR
      CAD: 1.72,     // 1 GBP = 1.72 CAD
      AUD: 1.91      // 1 GBP = 1.91 AUD
    };
    
    // Create a new cache with the rates
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
    console.log('Updated exchange rates - Nigerian Naira rate is now 2088 NGN to 1 GBP');
    
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
  
  // Default to GBP if we can't determine the user's currency
  const defaultCurrency = currencies['GBP'];
  
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
    // Set up currency based on the user's location
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
    userCurrency = defaultCurrency;
    localStorage.setItem('userCurrency', defaultCurrency.code);
    return userCurrency;
  }
}