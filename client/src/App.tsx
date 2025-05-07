import React, { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Simple Router component
const Router = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Special debug mode handling
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';
  
  useEffect(() => {
    if (debugMode && !user) {
      console.log("DEBUG MODE ACTIVATED - Trying beta login");
      
      fetch('/api/beta_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        console.log("Auto-login successful", data);
        queryClient.setQueryData(["/api/user"], data);
        window.location.href = '/';
      })
      .catch(err => {
        console.error("Debug login failed:", err);
      });
    }
  }, [debugMode, user]);
  
  // Simple auth routing
  if (location === '/auth') {
    return <AuthPage />;
  }
  
  // If not on auth page and not logged in, redirect to auth
  if (!user && !debugMode) {
    window.location.href = '/auth';
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Very simple router
  return (
    <div>
      <Switch>
        <Route path="/" component={() => <div className="p-4"><h1 className="text-2xl mb-4">Welcome to PuntaIQ</h1><p>You are logged in as {user?.username || 'guest'}</p></div>} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

// Simple App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
