import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  const [_, navigate] = useLocation();

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
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}