import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { parseApiError, handleApiError, checkOnlineStatus } from "./error-handler";

// List of error patterns to silently ignore (no toast notifications)
const SILENT_ERROR_PATTERNS = [
  'aborted',
  'cancelled',
  'navigation',
  'WebSocket',
  'Socket',
  'Unauthorized' // Prevent duplicate auth error toasts
];

// Session cookie name - used to check if we have a session even if we get a 401
const SESSION_COOKIE_NAME = 'connect.sid';

// Check if we have a session cookie set
export function hasSessionCookie(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse API error from response
    let error;
    try {
      // First try to parse as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        // Use server-provided error code and message if available
        error = {
          status: res.status,
          message: errorData.message || errorData.error || `Request failed with status ${res.status}`,
          code: errorData.code || `ERROR_${res.status}`
        };
      } else {
        // If not JSON, use generic parsing
        error = await parseApiError(res);
      }
    } catch (parseError) {
      console.warn('Error parsing error response:', parseError);
      // Fallback to generic error if parsing fails
      error = await parseApiError(res);
    }
    
    // Add more context to authentication errors
    if (res.status === 401) {
      const hasSession = hasSessionCookie();
      
      if (hasSession && (!error.code || error.code === 'ERROR_401')) {
        console.warn('Session cookie exists but server returned 401 - session may be invalid or expired');
        error.code = error.code || 'SESSION_INVALID';
        // Enhance the generic message if using the default
        if (error.message === `Request failed with status ${res.status}`) {
          error.message = 'Your session appears to be invalid or expired. Please login again.';
        }
      } else if (!hasSession && (!error.code || error.code === 'ERROR_401')) {
        console.warn('No session cookie found - user is not authenticated');
        error.code = error.code || 'NO_SESSION';
        // Enhance the generic message if using the default
        if (error.message === `Request failed with status ${res.status}`) {
          error.message = 'You need to log in to access this resource.';
        }
      }
    }
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if we're online first
  if (!checkOnlineStatus()) {
    throw {
      status: 0,
      message: 'You appear to be offline. Please check your internet connection and try again.',
      code: 'OFFLINE'
    };
  }
  
  try {
    // Create a controller to be able to abort requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Ensure all API calls are properly routed through our server
    let apiUrl = url;
    
    // Use PuntaIQ global configuration if available
    if (window.PuntaIQ) {
      if (url.startsWith('/api')) {
        // Route to our main API on port 3000
        apiUrl = `${window.PuntaIQ.apiBaseUrl || ''}${url}`;
        console.log(`Routing API call to main server: ${apiUrl}`);
      } 
      else if (url.startsWith('/ai-service') || url.startsWith('/ai/')) {
        // Route AI requests through our proxy
        const proxyPath = url.replace(/^\/ai\//, '/ai-service/');
        apiUrl = `${window.PuntaIQ.apiBaseUrl || ''}${proxyPath}`;
        console.log(`Routing AI service call through proxy: ${apiUrl}`);
      }
    } 
    // Fallback if window.PuntaIQ is not available
    else if (url.startsWith('/api') || url.startsWith('/ai-service')) {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
      apiUrl = `${baseUrl}${url}`;
      console.log(`Fallback routing to server: ${apiUrl}`);
    }
    
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Check if this is a silent error we should ignore
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isSilentError = SILENT_ERROR_PATTERNS.some(pattern => errorMessage.includes(pattern));
    
    if (isSilentError) {
      console.log('Silent error suppressed for request:', url, error);
      throw error;
    }

    // Skip error handling for aborted or cancelled requests
    if (error instanceof DOMException && 
       (error.name === 'AbortError' || error.message.includes('aborted'))) {
      console.log('Request was aborted:', url);
      throw error;
    }
    
    // Skip error handling for navigation-related errors
    if (error instanceof Error && 
        (error.message.includes('cancelled') || 
         error.message.includes('navigation'))) {
      console.log('Request was cancelled due to navigation:', url);
      throw error;
    }
    
    // Check if the document is hidden (user has switched tabs or is navigating away)
    if (document.hidden) {
      console.log('Error occurred while page is not visible - suppressing toast');
      throw error;
    }
    
    // Let the error handler deal with other errors (but only if active and visible)
    handleApiError(error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  on403?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, on403 }) =>
  async ({ queryKey }) => {
    // Check if we're online first
    if (!checkOnlineStatus()) {
      const offlineError = {
        status: 0,
        message: 'You appear to be offline. Please check your internet connection and try again.',
        code: 'OFFLINE'
      };
      handleApiError(offlineError);
      throw offlineError;
    }
    
    try {
      // Create a controller to be able to abort requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Ensure API calls are directed to port 3000 where our server is now running
      let url = queryKey[0] as string;
      if (url.startsWith('/api') && window.location.port !== '3000') {
        // Replace current port with port 3000 if we're not already on port 3000
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
        url = `${baseUrl}${url}`;
      }
      
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Handle forbidden error (403) similar to unauthorized if requested
      if (on403 === "returnNull" && res.status === 403) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Check if this is a silent error we should ignore
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isSilentError = SILENT_ERROR_PATTERNS.some(pattern => errorMessage.includes(pattern));
      
      if (isSilentError) {
        console.log('Silent error suppressed for query:', queryKey[0], error);
        throw error;
      }

      // Skip error handling for aborted or cancelled requests
      if (error instanceof DOMException && 
         (error.name === 'AbortError' || error.message.includes('aborted'))) {
        console.log('Query was aborted:', queryKey[0]);
        throw error;
      }
      
      // Skip error handling for navigation-related errors
      if (error instanceof Error && 
          (error.message.includes('cancelled') || 
           error.message.includes('navigation'))) {
        console.log('Query was cancelled due to navigation:', queryKey[0]);
        throw error;
      }
      
      // Check if the document is hidden (user has switched tabs or is navigating away)
      if (document.hidden) {
        console.log('Error occurred while page is not visible - suppressing toast');
        throw error;
      }
      
      // Let the error handler deal with other errors (but only if active and visible)
      handleApiError(error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // This prevents error toasts from being shown when a query fails on page changes
      retryOnMount: false
    },
    mutations: {
      retry: false
    },
  },
});
