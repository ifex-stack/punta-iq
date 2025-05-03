import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home, RefreshCw, RotateCw } from "lucide-react";
import { attemptRouteRecovery } from "@/lib/error-handler";

export default function NotFound() {
  const [_, navigate] = useLocation();
  const [currentPath, setCurrentPath] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoverCount, setRecoverCount] = useState(0);
  
  // On mount, track and attempt to resolve the issue
  useEffect(() => {
    // Set debug information
    setCurrentPath(window.location.pathname);
    setPageUrl(window.location.href);
    
    // Auto-recovery on load (one-time only)
    if (!recoveryAttempted && recoverCount === 0) {
      console.log("NotFound: Attempting automatic recovery");
      attemptRouteRecovery(window.location.pathname);
      setRecoveryAttempted(true);
      setRecoverCount(prev => prev + 1);
    }
  }, [recoveryAttempted, recoverCount]);
  
  // Try to recover the route again if needed
  const handleForceRecover = () => {
    console.log("NotFound: Manual recovery attempt");
    setRecoverCount(prev => prev + 1);
    
    // After multiple attempts, try a more direct approach
    if (recoverCount >= 2) {
      window.location.href = `${window.location.protocol}//${window.location.hostname}:3000/`;
    } else {
      // For first manual attempts, use the standard recovery logic
      attemptRouteRecovery(window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-12 w-12" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved. 
        </p>
        
        {/* Show technical details for debugging */}
        <div className="text-xs text-muted-foreground mb-6 p-3 bg-muted rounded-md">
          <p className="mb-1">Path: {currentPath}</p>
          <p className="mb-1">Port: {window.location.port}</p>
          <p className="mb-1">Recovery attempts: {recoverCount}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            type="button" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
          
          <Button 
            type="button"
            variant="secondary"
            onClick={handleForceRecover}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Page
          </Button>
          
          {recoverCount >= 2 && (
            <Button 
              type="button"
              variant="destructive"
              onClick={() => window.location.href = `${window.location.protocol}//${window.location.hostname}:3000/`}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Force Reload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}