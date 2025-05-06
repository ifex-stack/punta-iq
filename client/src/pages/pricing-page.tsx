import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  discountPercentage?: number;
}

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  
  // Define subscription interface
  interface UserSubscription {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  }
  
  // Fetch subscription plans and current user's subscription (if any)
  const { data: userSubscription } = useQuery<UserSubscription>({
    queryKey: ['/api/user/subscription'],
    enabled: !!user,
  });
  
  // Define subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: selectedInterval === 'month' ? 7.99 : 79.99,
      currency: '£',
      interval: selectedInterval,
      features: [
        'Daily AI Predictions',
        'Basic Win/Loss Stats',
        'Standard Sports Coverage',
        'Email Support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: selectedInterval === 'month' ? 14.99 : 149.99,
      currency: '£',
      interval: selectedInterval,
      features: [
        'All Basic Features',
        'Advanced Stats & Analytics',
        'Premium Predictions',
        'Priority Email Support',
        'Enhanced Accumulators'
      ],
      isPopular: true,
      discountPercentage: 16
    },
    {
      id: 'elite',
      name: 'Elite',
      price: selectedInterval === 'month' ? 29.99 : 299.99,
      currency: '£',
      interval: selectedInterval,
      features: [
        'All Pro Features',
        'VIP Predictions',
        'Expert Analysis',
        'Phone & Email Support',
        'Exclusive Content',
        'Custom Notifications'
      ],
      discountPercentage: 20
    }
  ];
  
  // Handle subscription purchase
  const handleSubscribe = (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to subscribe to this plan",
      });
      navigate('/auth');
      return;
    }
    
    // Navigate to checkout page with selected plan
    navigate(`/subscribe?plan=${planId}&interval=${selectedInterval}`);
  };
  
  // Check if user is subscribed to a plan
  const isSubscribedTo = (planId: string) => {
    return userSubscription?.planId === planId;
  };
  
  // Calculate annual savings
  const calculateAnnualSavings = (plan: SubscriptionPlan) => {
    if (selectedInterval === 'year' && plan.discountPercentage) {
      return plan.discountPercentage;
    }
    return 0;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mb-6 mt-2 text-center">
        <h1 className="text-xl font-bold mb-2">Unlock Expert AI Predictions</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Choose the perfect plan for your sports prediction needs
        </p>
        
        {/* Billing interval toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={selectedInterval === 'month' ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedInterval('month')}
              className="rounded-md text-xs h-8"
            >
              Monthly
            </Button>
            <Button
              variant={selectedInterval === 'year' ? "default" : "ghost"}
              size="sm" 
              onClick={() => setSelectedInterval('year')}
              className="rounded-md text-xs h-8"
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                Save 20%
              </span>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Pricing plans */}
      <section className="space-y-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {subscriptionPlans.map((plan) => (
            <motion.div key={plan.id} variants={itemVariants}>
              <Card className={plan.isPopular ? "border-primary border-2" : ""}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold">{plan.currency}{plan.price}</span>
                    <span className="text-muted-foreground ml-1">/{plan.interval}</span>
                  </div>
                  {calculateAnnualSavings(plan) > 0 && (
                    <span className="inline-block bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-full">
                      Save {calculateAnnualSavings(plan)}%
                    </span>
                  )}
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isSubscribedTo(plan.id)}
                  >
                    {isSubscribedTo(plan.id) ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}