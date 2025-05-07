import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, ArrowDown, CreditCard, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { PricingCard } from '@/components/pricing/pricing-card';
import { FeatureComparison } from '@/components/pricing/feature-comparison';
import { planIdToTier } from '@/lib/subscription-utils';

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
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');
  
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
  
  // Define enhanced subscription plans with more detailed features
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: selectedInterval === 'month' ? 7.99 : 79.99,
      currency: '£',
      interval: selectedInterval,
      features: [
        '10 daily AI predictions',
        'Basic win/loss stats',
        '4 sports coverage',
        '3 months historical data',
        'Basic accumulators (up to 4 selections)',
        'Email support'
      ],
      discountPercentage: 16
    },
    {
      id: 'pro',
      name: 'Pro',
      price: selectedInterval === 'month' ? 14.99 : 149.99,
      currency: '£',
      interval: selectedInterval,
      features: [
        '25 daily AI predictions',
        'Premium predictions & analytics',
        '8 sports coverage',
        '12 months historical data',
        'Enhanced accumulators (up to 6 selections)',
        'Custom notifications',
        'Odds comparison tool',
        'Priority support'
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
        'Unlimited AI predictions',
        'VIP & premium predictions',
        'All sports coverage',
        'Full historical data access',
        'Unlimited accumulator selections',
        'Advanced betting strategy tools',
        'Expert analysis on all predictions',
        'Priority phone & email support'
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
    
    // Navigate to subscription page with selected plan
    navigate(`/subscription?plan=${planId}&interval=${selectedInterval}`);
  };
  
  // Check if user is subscribed to a plan
  const isSubscribedTo = (planId: string) => {
    return userSubscription?.planId === planId;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6 } }
  };
  
  return (
    <div className="relative pb-20 overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground 
        variant="waves" 
        intensity="medium"
        className="absolute inset-0 h-full w-full"
      />
      
      {/* Header with glass effect */}
      <section className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 mt-2 text-center"
        >
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-move">
            Unlock Expert AI Predictions
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
            Choose the perfect plan for your sports prediction needs and take your betting to the next level with our advanced AI technology
          </p>
          
          {/* Billing interval toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center rounded-lg border p-1 bg-background/50 backdrop-blur-sm">
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
          
          {/* View mode selector */}
          <div className="flex justify-center mb-8">
            <Tabs 
              value={viewMode} 
              onValueChange={(v) => setViewMode(v as 'cards' | 'comparison')}
              className="relative z-10"
            >
              <TabsList className="grid grid-cols-2 w-[300px] bg-background/50 backdrop-blur-sm">
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="comparison">Compare Features</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>
      </section>
      
      {/* Card view */}
      <TabsContent value="cards" className={viewMode === 'cards' ? 'block' : 'hidden'}>
        <section className="relative z-10 mx-auto max-w-5xl px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {subscriptionPlans.map((plan) => (
              <motion.div key={plan.id} variants={itemVariants}>
                <PricingCard
                  id={plan.id}
                  name={plan.name}
                  price={plan.price}
                  currency={plan.currency}
                  interval={selectedInterval}
                  features={plan.features}
                  isPopular={plan.isPopular}
                  discountPercentage={plan.discountPercentage}
                  onSubscribe={handleSubscribe}
                  isCurrentPlan={isSubscribedTo(plan.id)}
                  isPremium={plan.id === 'elite'}
                />
              </motion.div>
            ))}
          </motion.div>
          
          {/* Call to action */}
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="show"
            className="mt-12 text-center"
          >
            <div className="mx-auto max-w-2xl p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="text-lg font-bold mb-2">Get Started with PuntaIQ Today</h2>
              <p className="text-muted-foreground mb-4">
                Join thousands of sports fans who are transforming their betting with AI-powered predictions.
              </p>
              <Button onClick={() => handleSubscribe('pro')} className="font-medium">
                <Zap className="h-4 w-4 mr-2" />
                Start Your Free Trial
              </Button>
            </div>
          </motion.div>
        </section>
      </TabsContent>
      
      {/* Comparison view */}
      <TabsContent value="comparison" className={viewMode === 'comparison' ? 'block' : 'hidden'}>
        <section className="relative z-10 mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="show"
          >
            <FeatureComparison 
              selectedInterval={selectedInterval}
              onSubscribe={handleSubscribe}
              currentPlanId={userSubscription?.planId}
            />
          </motion.div>
        </section>
      </TabsContent>
      
      {/* Additional benefits */}
      <section className="relative z-10 mt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-6 text-center">Why Choose PuntaIQ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our advanced AI models analyze millions of data points to deliver predictions with industry-leading accuracy.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>30-Day Money Back</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you're not completely satisfied with your subscription, we offer a 30-day money-back guarantee.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Pro Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get access to expert analysis and insights that go beyond the numbers to help inform your betting decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>
      
      {/* FAQ Section */}
      <section className="relative z-10 mt-16 px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades will apply at the end of your current billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">How accurate are the predictions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI models consistently achieve accuracy rates above industry standards. Premium and VIP predictions typically have higher confidence scores, with historical success rates detailed in your account dashboard.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">How is my subscription billed?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your subscription will be automatically billed at the start of each period (monthly or yearly) until you cancel. We accept all major credit cards and debit cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>
    </div>
  );
}