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
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Let the error handler deal with the error
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
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Let the error handler deal with the error
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
    },
    mutations: {
      retry: false,
    },
  },
});
