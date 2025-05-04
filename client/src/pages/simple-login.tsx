import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SimpleLoginPage() {
  const [username, setUsername] = useState('beta_tester');
  const [password, setPassword] = useState('puntaiq_beta_test');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      const data = await res.json().catch(e => {
        console.error('Error parsing JSON response:', e);
        return { error: 'Invalid response format' };
      });
      
      console.log('Login response data:', data);
      setResponse(data);
      
      if (res.ok) {
        toast({
          title: "Login successful!",
          description: "You are now logged in as " + data.username,
        });
      } else {
        toast({
          title: "Login failed",
          description: data.message || 'Invalid username or password',
          variant: "destructive",
        });
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
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
      
      console.log('Attempting registration with:', { username, password });
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password,
          email: `${username}@example.com`
        }),
        credentials: 'include'
      });
      
      console.log('Registration response status:', res.status);
      
      const data = await res.json().catch(e => {
        console.error('Error parsing JSON response:', e);
        return { error: 'Invalid response format' };
      });
      
      console.log('Registration response data:', data);
      setResponse(data);
      
      if (res.ok) {
        toast({
          title: "Registration successful!",
          description: "You are now registered and logged in as " + data.username,
        });
      } else {
        toast({
          title: "Registration failed",
          description: data.message || 'Could not create account',
          variant: "destructive",
        });
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
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

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Simple Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="w-full"
            />
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
                'Login'
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
                'Register'
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}
          
          {response && (
            <div className="mt-4">
              <Label>Response:</Label>
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-60">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground mt-4">
            <p>Debug notes:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Default credentials: beta_tester / puntaiq_beta_test</li>
              <li>This page bypasses the regular auth hooks for testing</li>
              <li>Full response is displayed for debugging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}