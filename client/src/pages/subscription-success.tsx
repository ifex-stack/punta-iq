import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SubscriptionSuccessPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="container py-16 max-w-3xl">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
          <CardTitle className="text-3xl">Subscription Successful!</CardTitle>
          <CardDescription className="text-lg">Thank you for subscribing to PuntaIQ</CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your subscription has been successfully processed. You now have access to premium predictions and features.
            </p>
            
            <div className="flex flex-col space-y-2 max-w-md mx-auto my-6 text-left">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to premium predictions and advanced statistics</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Entry to premium fantasy contests with larger prize pools</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>AI-powered insights and exclusive expert analysis</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Priority customer support and early access to new features</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/predictions")}
            className="sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Predictions
          </Button>
          <Button onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}