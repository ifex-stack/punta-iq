import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { parseApiError, handleApiError, checkOnlineStatus } from "./error-handler";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = await parseApiError(res);
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
    
    const res = await fetch(url, {
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
    
    // Let the error handler deal with other errors
    handleApiError(error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
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
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
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
      
      // Let the error handler deal with other errors
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
      retryOnMount: false,
      // Custom error handling to prevent toast spamming
      onError: (error) => {
        // Silence query errors during navigation
        if (error instanceof Error && 
            (error.message.includes('cancelled') || 
             error.message.includes('aborted'))) {
          console.log('Query cancelled during navigation:', error);
        }
      }
    },
    mutations: {
      retry: false,
    },
  },
});
