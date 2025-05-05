import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Loader2 } from "lucide-react";

export default function LoginTestPage() {
  const { user, loginMutation, isLoading } = useAuth();
  const [loginStatus, setLoginStatus] = useState('');
  
  const handleLogin = () => {
    setLoginStatus('Attempting login...');
    loginMutation.mutate(
      {
        username: 'beta_tester',
        password: 'puntaiq_beta_test'
      },
      {
        onSuccess: () => {
          setLoginStatus('Login successful!');
        },
        onError: (error) => {
          setLoginStatus(`Login failed: ${error.message}`);
        }
      }
    );
  };

  return (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <div className="max-w-md mx-auto rounded-lg bg-card p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Authentication Test</h1>
        
        <div className="mb-6 p-4 bg-muted rounded-md">
          <h2 className="text-lg font-medium mb-2">Authentication Status:</h2>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking auth status...</span>
            </div>
          ) : user ? (
            <div className="text-green-500">
              <p className="font-medium">✓ Logged in as: {user.username}</p>
              <p className="text-sm mt-1 text-muted-foreground">User ID: {user.id}</p>
              {user.subscriptionTier && (
                <p className="text-sm mt-1 text-muted-foreground">
                  Subscription: {user.subscriptionTier}
                </p>
              )}
            </div>
          ) : (
            <p className="text-yellow-500">✗ Not logged in</p>
          )}
        </div>
        
        <div className="mb-6">
          <button 
            className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 font-medium"
            onClick={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login as beta_tester</span>
            )}
          </button>
          
          {loginStatus && (
            <p className={`mt-2 text-sm ${
              loginStatus.includes('successful') ? 'text-green-500' : 
              loginStatus.includes('failed') ? 'text-red-500' : 'text-blue-500'
            }`}>
              {loginStatus}
            </p>
          )}
        </div>
        
        {loginMutation.error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
            <p className="font-medium">Error Details:</p>
            <p className="mt-1">{loginMutation.error.message}</p>
          </div>
        )}
        
        {user && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">User Data:</h2>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}