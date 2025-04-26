import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ChevronLeft, 
  CreditCard, 
  Loader2, 
  Sparkles, 
  Trophy, 
  Globe, 
  Calendar, 
  TrendingUp,
  Users
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Available currencies with their symbols and exchange rates
const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1, name: "US Dollar" },
  { code: "GBP", symbol: "£", rate: 0.79, name: "British Pound" },
  { code: "EUR", symbol: "€", rate: 0.92, name: "Euro" },
  { code: "NGN", symbol: "₦", rate: 1550, name: "Nigerian Naira" }
];

// Base subscription plans in USD
const BASE_SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 4.99,
    yearlyPrice: 49.99, // Save ~$10 with yearly billing
    description: "Perfect for casual fans looking for reliable predictions",
    features: [
      "Access to predictions for 1 sport",
      "Basic accumulator tips (up to 15 odds)",
      "Free fantasy contests entry",
      "Basic statistics dashboard",
      "Daily notifications for new predictions",
      "Email support"
    ],
    color: "bg-slate-100 dark:bg-slate-800",
    accentColor: "text-slate-600 dark:text-slate-400",
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    yearlyPrice: 99.99, // Save ~$20 with yearly billing
    description: "Enhanced insights for the serious sports enthusiast",
    features: [
      "All sports predictions included",
      "Medium accumulator tips (up to 30 odds)",
      "Premium fantasy contests entry",
      "Advanced statistics and trend analysis",
      "In-app chat support",
      "Performance tracking dashboard",
      "Priority notifications for value bets"
    ],
    color: "bg-primary/10 dark:bg-primary/20",
    accentColor: "text-primary dark:text-primary",
    popular: true
  },
  {
    id: "elite",
    name: "Elite",
    price: 20.00,
    yearlyPrice: 199.99, // Save ~$40 with yearly billing
    description: "The ultimate prediction package for maximum success",
    features: [
      "Priority access to high-confidence predictions",
      "Premium accumulator tips (up to 50 odds)",
      "Exclusive VIP fantasy contests ($100 prize pool)",
      "Advanced pattern recognition insights",
      "Personal prediction strategy consultation",
      "Real-time value betting alerts",
      "24/7 priority support",
      "No ads or promotions"
    ],
    color: "bg-amber-100 dark:bg-amber-900/30",
    accentColor: "text-amber-600 dark:text-amber-400",
    popular: false
  }
];

// Interface for subscription plan
interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  color: string;
  accentColor: string;
  popular: boolean;
}

// Calculate prices based on currency and billing cycle
const formatPrice = (price: number, currency: typeof CURRENCIES[0], isYearly = false) => {
  const value = (price * currency.rate).toFixed(2);
  // For Naira, don't show decimals
  return currency.code === 'NGN' ? `${currency.symbol}${Math.round(Number(value))}` : `${currency.symbol}${value}`;
};

export default function SubscriptionPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [isYearly, setIsYearly] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Plan[]>([]);
  
  // Get user's location and set the appropriate currency
  useEffect(() => {
    // In a real app, we'd use the browser's geolocation API 
    // or IP-based location services to detect the user's country
    // For demo purposes, we'll default to USD
    
    const detectUserCurrency = async () => {
      try {
        // This could be replaced with actual geolocation or IP-based detection
        const mockCountryCode: string = 'US'; // Default to US
        
        // Find the appropriate currency based on country code
        if (mockCountryCode === 'GB') {
          setSelectedCurrency(CURRENCIES.find(c => c.code === 'GBP') || CURRENCIES[0]);
        } else if (mockCountryCode === 'NG') {
          setSelectedCurrency(CURRENCIES.find(c => c.code === 'NGN') || CURRENCIES[0]);
        } else if (['DE', 'FR', 'IT', 'ES'].includes(mockCountryCode)) {
          setSelectedCurrency(CURRENCIES.find(c => c.code === 'EUR') || CURRENCIES[0]);
        }
      } catch (error) {
        console.error('Error detecting user location:', error);
      }
    };
    
    detectUserCurrency();
  }, []);
  
  // Update subscription plans with pricing information
  useEffect(() => {
    const plans = BASE_SUBSCRIPTION_PLANS.map(plan => ({
      ...plan
    }));
    setSubscriptionPlans(plans);
  }, [selectedCurrency, isYearly]);
  
  const subscribeMutation = useMutation({
    mutationFn: async (planData: { planId: string, isYearly: boolean, currencyCode: string }) => {
      const res = await apiRequest("POST", "/api/create-subscription", {
        userId: user?.id,
        ...planData
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
    subscribeMutation.mutate({
      planId,
      isYearly,
      currencyCode: selectedCurrency.code
    });
  };

  // Calculate savings percentage for yearly billing
  const getSavingsPercentage = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const yearlyCost = yearlyPrice;
    const savings = ((monthlyCost - yearlyCost) / monthlyCost) * 100;
    return Math.round(savings);
  };
  
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center">
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
        
        <div className="flex items-center space-x-4 ml-auto">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedCurrency.code}
              onValueChange={(value) => {
                const currency = CURRENCIES.find(c => c.code === value);
                if (currency) setSelectedCurrency(currency);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={isYearly ? "yearly" : "monthly"}
              onValueChange={(value) => setIsYearly(value === "yearly")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly (Save up to 17%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold mb-4">Choose the Right Plan for You</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access our AI-powered sports predictions with a subscription that fits your needs. 
          Upgrade anytime as your strategy evolves.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {BASE_SUBSCRIPTION_PLANS.map((plan: Plan) => (
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
                  {isYearly ? "Yearly" : "Monthly"}
                </Badge>
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {formatPrice(
                    isYearly ? plan.yearlyPrice : plan.price, 
                    selectedCurrency
                  )}
                </span>
                <span className="text-muted-foreground ml-1">
                  {isYearly ? "/year" : "/month"}
                </span>
              </div>
              {isYearly && (
                <div className="mt-1 text-sm text-green-600 dark:text-green-500">
                  Save {getSavingsPercentage(plan.price, plan.yearlyPrice)}%
                </div>
              )}
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature: string, i: number) => (
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
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/50 rounded-lg p-6">
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
        
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-start">
            <Users className="h-6 w-6 text-primary mr-4 mt-1" />
            <div>
              <h3 className="text-xl font-medium mb-2">Fantasy Contest Features</h3>
              <p className="text-muted-foreground mb-4">
                Each subscription tier includes access to our fantasy sports contests with different benefits.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Badge variant="outline" className="mr-2 mt-0.5">Basic</Badge>
                  <span className="text-sm">Access to all free contests with weekly prizes</span>
                </div>
                <div className="flex items-start">
                  <Badge variant="default" className="mr-2 mt-0.5">Pro</Badge>
                  <span className="text-sm">Entry to premium contests with larger prize pools</span>
                </div>
                <div className="flex items-start">
                  <Badge className="bg-amber-600 mr-2 mt-0.5">Elite</Badge>
                  <span className="text-sm">Exclusive VIP contests with $100 guaranteed prize pools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}