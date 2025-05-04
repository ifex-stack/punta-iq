import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

/**
 * QuickLoginPage - Simplified login page that automatically attempts to log in a user
 * with beta test credentials. Used for troubleshooting authentication issues.
 */
export default function QuickLoginPage() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to login");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Default credentials
  const username = 'beta_tester';
  const password = 'puntaiq_beta_test';
  
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Attempting login...");
      
      console.log('Attempting login with:', { username, password });
      
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      console.log('Login response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('Login response data:', data);
        setResponse(data);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        setStatusMessage("Error parsing response (not JSON)");
        
        // Try to get text content
        const textContent = await res.text();
        console.log('Response as text:', textContent);
        data = { error: 'Invalid response format', textContent };
      }
      
      if (res.ok) {
        setStatusMessage("Login successful! Getting user data...");
        
        // Verify the session worked by trying to get user data
        const userCheck = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (userCheck.ok) {
          const userData = await userCheck.json();
          console.log('User data check:', userData);
          setStatusMessage("Session verified! User data received.");
          
          toast({
            title: "Login successful!",
            description: "You are now logged in as " + userData.username,
          });
          
          // Redirect to the predictions page after 2 seconds
          setTimeout(() => {
            setLocation('/predictions');
          }, 2000);
        } else {
          setStatusMessage("Warning: Login succeeded but session check failed.");
          toast({
            title: "Partial success",
            description: "Login succeeded but session verification failed",
            variant: "destructive",
          });
        }
      } else {
        setStatusMessage("Login failed");
        toast({
          title: "Login failed",
          description: data.message || 'Invalid username or password',
          variant: "destructive",
        });
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setStatusMessage("Login error (see console)");
      toast({
        title: "Login error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Attempting registration...");
      
      console.log('Attempting registration with:', { username, password });
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password,
          email: `${username}@example.com`,
          isActive: true,
          isEmailVerified: true,
        }),
        credentials: 'include'
      });
      
      console.log('Registration response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('Registration response data:', data);
        setResponse(data);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        const textContent = await res.text();
        console.log('Response as text:', textContent);
        data = { error: 'Invalid response format', textContent }; 
      }
      
      if (res.ok) {
        setStatusMessage("Registration successful!");
        toast({
          title: "Registration successful!",
          description: "You are now registered and logged in as " + data.username,
        });
        
        // Redirect to the predictions page after 2 seconds
        setTimeout(() => {
          setLocation('/predictions');
        }, 2000);
      } else {
        setStatusMessage("Registration failed");
        toast({
          title: "Registration failed",
          description: data.message || 'Could not create account',
          variant: "destructive",
        });
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setStatusMessage("Registration error (see console)");
      toast({
        title: "Registration error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to call the direct test user API
  const createTestUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Creating/resetting test user...");
      
      console.log('Attempting to create/reset test user');
      
      const res = await fetch('/api/create-test-user', {
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('Create test user response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('Create test user response data:', data);
        setResponse(data);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        const textContent = await res.text();
        console.log('Response as text:', textContent);
        data = { error: 'Invalid response format', textContent }; 
      }
      
      if (res.ok) {
        setStatusMessage("Test user created/reset successfully!");
        toast({
          title: "Test user ready",
          description: "Test user has been created or reset. Now try to login."
        });
      } else {
        setStatusMessage("Failed to create/reset test user");
        toast({
          title: "User creation failed",
          description: data.message || 'Could not create test user',
          variant: "destructive",
        });
        setError(data.message || 'Failed to create test user');
      }
    } catch (err) {
      console.error('Create test user error:', err);
      setStatusMessage("Create test user error (see console)");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to use the direct quick login API
  const quickLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessage("Using quick login API...");
      
      console.log('Attempting quick login API');
      
      const res = await fetch('/api/quick-login', {
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('Quick login response status:', res.status);
      
      let data;
      try {
        data = await res.json();
        console.log('Quick login response data:', data);
        setResponse(data);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        const textContent = await res.text();
        console.log('Response as text:', textContent);
        data = { error: 'Invalid response format', textContent }; 
      }
      
      if (res.ok) {
        setStatusMessage("Quick login successful!");
        toast({
          title: "Quick login successful!",
          description: "You are now logged in as " + data.user.username,
        });
        
        // Redirect to the predictions page after 2 seconds
        setTimeout(() => {
          setLocation('/predictions');
        }, 2000);
      } else {
        setStatusMessage("Quick login failed");
        toast({
          title: "Quick login failed",
          description: data.message || 'Could not login',
          variant: "destructive",
        });
        setError(data.message || 'Quick login failed');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      setStatusMessage("Quick login error (see console)");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Try direct test user API on load
  useEffect(() => {
    quickLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quick Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
            <p className="font-semibold mb-1">Status:</p>
            <p className="text-sm">{statusMessage}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button 
                onClick={createTestUser} 
                className="flex-1" 
                disabled={loading}
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create/Reset Test User'
                )}
              </Button>
              
              <Button 
                onClick={quickLogin} 
                className="flex-1" 
                disabled={loading}
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Quick Login...
                  </>
                ) : (
                  'Direct Quick Login'
                )}
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleLogin} 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Standard Login'
                )}
              </Button>
              
              <Button 
                onClick={handleRegister} 
                className="flex-1" 
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Standard Register'
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}
          
          {response && (
            <div className="mt-4">
              <p className="font-semibold mb-1">Response:</p>
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-60">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground mt-4">
            <p>Using credentials:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li><strong>Username:</strong> {username}</li>
              <li><strong>Password:</strong> {password}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}