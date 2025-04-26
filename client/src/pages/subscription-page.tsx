import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, CreditCard, Loader2, Sparkles, Trophy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    description: "Get started with essential predictions",
    features: [
      "1 sport of your choice",
      "2-fold accumulators",
      "Basic statistics dashboard",
      "Daily predictions",
      "Email support"
    ],
    color: "bg-slate-100 dark:bg-slate-800",
    accentColor: "text-slate-600 dark:text-slate-400",
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    description: "The perfect plan for serious enthusiasts",
    features: [
      "All sports included",
      "2-fold and 5-fold accumulators",
      "Advanced statistics dashboard",
      "Trend analysis and insights",
      "Priority notifications",
      "Priority support"
    ],
    color: "bg-primary/10 dark:bg-primary/20",
    accentColor: "text-primary dark:text-primary",
    popular: true
  },
  {
    id: "elite",
    name: "Elite",
    price: 29.99,
    description: "Maximum accuracy and premium features",
    features: [
      "All sports with highest accuracy",
      "2, 5, and 10-fold accumulators",
      "Premium statistical analysis",
      "Instant alerts for high-value opportunities",
      "Personal prediction strategy",
      "24/7 priority support"
    ],
    color: "bg-amber-100 dark:bg-amber-900/30",
    accentColor: "text-amber-600 dark:text-amber-400",
    popular: false
  }
];

export default function SubscriptionPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/create-subscription", {
        userId: user?.id,
        planId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSubscribe = (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };
  
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold mb-4">Choose the Right Plan for You</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access our AI-powered sports predictions with a subscription that fits your needs. 
          Upgrade anytime as your strategy evolves.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} overflow-hidden`}
          >
            {plan.popular && (
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 inline-block mr-1" /> Most Popular
              </div>
            )}
            <CardHeader className={`${plan.color}`}>
              <CardTitle className="flex justify-between items-center">
                <span>{plan.name}</span>
                <Badge variant={plan.popular ? "default" : "outline"} className="text-xs">
                  Monthly
                </Badge>
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className={`h-5 w-5 mr-2 ${plan.accentColor} shrink-0 mt-0.5`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {subscribeMutation.isPending && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 bg-muted/50 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex items-start">
          <Trophy className="h-6 w-6 text-primary mr-4 mt-1" />
          <div>
            <h3 className="text-xl font-medium mb-2">Subscription Benefits</h3>
            <p className="text-muted-foreground mb-4">
              All subscriptions include unlimited access to your selected prediction tier, with no hidden fees 
              or long-term commitments. You can cancel your subscription at any time.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Secure payments via Stripe</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Cancel anytime, no contracts</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Switch plans anytime</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">New predictions every day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}