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

// Handle API errors with appropriate UI feedback
export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred'): ApiError => {
  // Network error
  if (error instanceof Error && error.message === 'Failed to fetch') {
    const networkError = {
      status: 0,
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR'
    };
    
    toast({
      title: 'Connection Error',
      description: networkError.message,
      variant: 'destructive',
    });
    
    return networkError;
  }
  
  // Known API error
  if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
    const apiError = error as ApiError;
    
    // Handle different error types
    if (apiError.status === 401) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
    } else if (apiError.status === 403) {
      toast({
        title: 'Access Denied',
        description: apiError.message || 'You don\'t have permission to access this resource',
        variant: 'destructive',
      });
    } else if (apiError.status === 404) {
      toast({
        title: 'Not Found',
        description: apiError.message || 'The requested resource was not found',
        variant: 'destructive',
      });
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
  
  // Unknown error
  console.error('Unhandled error:', error);
  const unknownError = {
    status: 500,
    message: fallbackMessage
  };
  
  // Universal error filter for common navigation and connection issues
  // This comprehensive check prevents error toasts for many common scenarios
  const shouldSuppressToast = 
    // WebSocket related errors 
    fallbackMessage.includes('WebSocket') || 
    (error instanceof Error && error.message.includes('WebSocket')) ||
    // Navigation related errors
    fallbackMessage.includes('aborted') ||
    fallbackMessage.includes('navigation') ||
    fallbackMessage.includes('cancelled') ||
    (error instanceof Error && 
      (error.message.includes('aborted') || 
       error.message.includes('cancelled') || 
       error.message.includes('navigation'))) ||
    // Connection errors that happen during navigation
    (error instanceof DOMException) ||
    // General network errors during navigation
    (typeof error === 'object' && error !== null && 
     'name' in error && (error.name === 'AbortError' || 
                         error.name === 'NetworkError'));
  
  if (!shouldSuppressToast) {
    toast({
      title: 'Something went wrong',
      description: fallbackMessage,
      variant: 'destructive',
    });
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