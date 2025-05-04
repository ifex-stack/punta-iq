import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function DebugAuthPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [username, setUsername] = useState("beta_tester");
  const [password, setPassword] = useState("puntaiq_beta_test");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleDebugLogin = async () => {
    try {
      setIsLoading(true);
      setResponse("");
      
      // Make a direct fetch request to bypass the auth hooks
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      
      if (res.ok) {
        toast({
          title: "Debug login successful",
          description: `Logged in as ${data.username}`,
          variant: "default",
        });
        
        // Force refresh the page to ensure the session is picked up
        window.location.href = "/";
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Debug login error:", error);
      setResponse(JSON.stringify({ error: String(error) }, null, 2));
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Debug Authentication</CardTitle>
          <CardDescription>
            Test direct login requests to debug authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleDebugLogin} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Test Direct Login"}
          </Button>
          
          {response && (
            <div className="mt-4">
              <Label>Response:</Label>
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-60">
                {response}
              </pre>
            </div>
          )}
          
          {user && (
            <div className="mt-4 p-3 bg-primary/10 rounded-md">
              <h3 className="font-medium mb-1">Current User:</h3>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}