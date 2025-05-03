import { toast } from "@/hooks/use-toast";

// Error types
export type ApiError = {
  status: number;
  message: string;
  code?: string;
};

// Parse error from API response
export const parseApiError = async (response: Response): Promise<ApiError> => {
  try {
    const data = await response.json();
    return {
      status: response.status,
      message: data.message || 'An unknown error occurred',
      code: data.code
    };
  } catch (e) {
    return {
      status: response.status,
      message: response.statusText || 'An unknown error occurred'
    };
  }
};

// Error patterns that should be silently suppressed
export const SILENT_ERROR_PATTERNS = [
  'WebSocket',
  'Socket',
  'aborted',
  'cancelled',
  'navigation',
  'Network',
  'Connection',
  'Failed to fetch',
  'TypeError',
  'error',
  'Error',
  'AbortError',
  'NetworkError',
  'Error during navigation'
];

// Global flag to track navigation state and suppress errors during navigation
let isNavigating = false;

// Set navigation state when the user is navigating between routes
export const setNavigationState = (navigating: boolean) => {
  isNavigating = navigating;
  // Set a timeout to reset after navigation should be complete
  if (navigating) {
    setTimeout(() => {
      isNavigating = false;
    }, 3000); // Reset after 3 seconds
  }
};

// Advanced route recovery function for handling 404s and route errors
export const attemptRouteRecovery = (path: string): void => {
  console.log(`Attempting route recovery for path: ${path}`);
  
  // Don't try to recover API routes
  if (path.startsWith('/api/')) {
    console.log(`Not attempting recovery for API path: ${path}`);
    return;
  }
  
  // Make sure we're on the right port before attempting recovery
  if (window.location.port !== '3000' && 
      (window.location.hostname.includes('replit.dev') || window.location.hostname === 'localhost')) {
    // We need to redirect to port 3000 first
    console.log('Redirecting to port 3000 before route recovery');
    window.location.href = `${window.location.protocol}//${window.location.hostname}:3000${path}`;
    return;
  }
  
  // Set navigation state to true to prevent error toasts during recovery
  setNavigationState(true);
  
  // Try client-side navigation via history API
  window.history.replaceState(null, '', path);
  
  // Dispatch events to trigger route listeners
  window.dispatchEvent(new Event('popstate'));
  window.dispatchEvent(new CustomEvent('routeRecovery', { detail: { path } }));
  
  console.log(`Route recovery attempted for: ${path}`);
};

// Handle API errors with appropriate UI feedback
export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred'): ApiError => {
  // If we're in the middle of navigation, suppress all errors
  if (isNavigating || document.hidden) {
    console.log('Error suppressed due to navigation or hidden document:', error);
    return {
      status: 0,
      message: 'Navigation error suppressed',
      code: 'NAVIGATION'
    };
  }
  
  // Network error
  if (error instanceof Error && error.message === 'Failed to fetch') {
    const networkError = {
      status: 0,
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR'
    };
    
    // Don't show network error toasts as they're usually navigation related
    console.log('Network error suppressed:', error);
    return networkError;
  }
  
  // Known API error
  if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
    const apiError = error as ApiError;
    
    // Check if this API error is silent
    const errorMessage = String(apiError.message || '');
    const isSilentError = SILENT_ERROR_PATTERNS.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isSilentError) {
      console.log('Silent API error suppressed:', apiError);
      return apiError;
    }
    
    // Handle different error types
    if (apiError.status === 401) {
      // Check for specific auth error codes to provide better UX
      if (apiError.code === 'SESSION_INVALID' || apiError.code === 'INVALID_SESSION') {
        // Session was valid but has expired - might want to show a login prompt
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'default',
        });
      } else if (apiError.code === 'SESSION_ERROR' || apiError.code === 'SESSION_ERROR_AFTER_REGISTER') {
        // Session creation failed - server issue
        toast({
          title: 'Authentication Error',
          description: apiError.message || 'There was a problem with your session. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Don't show generic auth errors, they're handled by the auth system
        console.log('Auth error suppressed:', apiError);
      }
    } else if (apiError.status === 403) {
      toast({
        title: 'Access Denied',
        description: apiError.message || 'You don\'t have permission to access this resource',
        variant: 'destructive',
      });
    } else if (apiError.status === 404) {
      // Don't show 404 errors as they're often navigation related
      console.log('404 error suppressed:', apiError);
    } else if (apiError.status >= 500) {
      toast({
        title: 'Server Error',
        description: 'We\'re experiencing technical difficulties. Please try again later.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Error',
        description: apiError.message || fallbackMessage,
        variant: 'destructive',
      });
    }
    
    return apiError;
  }
  
  // Unknown error - check if we should suppress it
  console.error('Unhandled error:', error);
  const unknownError = {
    status: 500,
    message: fallbackMessage
  };
  
  // Universal error filter for common navigation and connection issues
  // This comprehensive check prevents error toasts for many common scenarios
  const errorMessage = error instanceof Error ? error.message : String(error);
  const shouldSuppressToast = 
    // Check against all silent error patterns
    SILENT_ERROR_PATTERNS.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase()) || 
      fallbackMessage.toLowerCase().includes(pattern.toLowerCase())
    ) ||
    // Connection errors that happen during navigation
    (error instanceof DOMException) ||
    // General network errors during navigation
    (typeof error === 'object' && error !== null && 
     'name' in error && (error.name === 'AbortError' || 
                         error.name === 'NetworkError'));
  
  if (!shouldSuppressToast) {
    // Final check - don't show toasts if we're navigating or document is hidden
    if (!document.hidden) {
      toast({
        title: 'Something went wrong',
        description: fallbackMessage,
        variant: 'destructive',
      });
    } else {
      console.log('Toast suppressed because document is hidden:', fallbackMessage);
    }
  } else {
    console.log('Toast suppressed based on error patterns:', error);
  }
  
  return unknownError;
};

// Create an offline detection utility
export const checkOnlineStatus = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Add event listeners for online/offline status
export const setupOfflineDetection = (onOffline?: () => void, onOnline?: () => void): (() => void) => {
  const handleOffline = () => {
    toast({
      title: 'You\'re offline',
      description: 'Please check your connection and try again',
      variant: 'destructive',
    });
    onOffline?.();
  };
  
  const handleOnline = () => {
    toast({
      title: 'You\'re back online',
      description: 'Your connection has been restored',
      variant: 'default',
    });
    onOnline?.();
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }
  
  return () => {}; // Empty cleanup for SSR
};