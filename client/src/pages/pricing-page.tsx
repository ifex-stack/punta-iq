import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet";
import { MobileAppLayout } from '@/components/layout/mobile-app-layout';
import { useAuth } from '@/hooks/use-auth';
import { 
  DollarSign,
  Star,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
  BarChart,
  Zap,
  Trophy,
  Medal,
  Clock,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  color: string;
  icon: React.ElementType;
}

export default function PricingPage() {
  const [_, navigate] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();
  
  // Pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingPeriod === 'monthly' ? 7.99 : 79.99,
      currency: '£',
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'Essential prediction features for casual bettors',
      features: [
        '20 daily predictions',
        'Basic sports coverage',
        'Standard accuracy reporting',
        'Email notifications',
        '24-hour predictions window'
      ],
      popular: false,
      color: 'blue',
      icon: Medal
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingPeriod === 'monthly' ? 14.99 : 149.99,
      currency: '£',
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'Advanced features for serious prediction enthusiasts',
      features: [
        'Unlimited predictions',
        'All sports coverage',
        'Advanced statistics & metrics',
        'Real-time alerts',
        '72-hour predictions window',
        'Exclusive Pro markets access',
        'AI-powered accumulator builder'
      ],
      popular: true,
      color: 'purple',
      icon: Trophy
    },
    {
      id: 'elite',
      name: 'Elite',
      price: billingPeriod === 'monthly' ? 29.99 : 299.99,
      currency: '£',
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'Premium experience with exclusive features',
      features: [
        'Everything in Pro plan',
        'Elite-only predictions',
        'Early access to new features',
        'Personalized AI insights',
        '7-day predictions window',
        'Detailed performance analytics',
        'Custom alert preferences',
        'VIP support'
      ],
      popular: false,
      color: 'gold',
      icon: Crown
    },
  ];
  
  // FAQ items
  const faqItems = [
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through Stripe.'
    },
    {
      question: 'Can I switch between plans?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you\'ll be charged the prorated difference. If you downgrade, the change will take effect at the end of your current billing period.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'We offer a 7-day free trial for new users on the Pro plan. You\'ll need to provide payment details, but won\'t be charged until the trial ends.'
    },
    {
      question: 'How accurate are the predictions?',
      answer: 'Our AI prediction system is constantly improving, with typical accuracy rates of 60-65% across different sports and markets. Accuracy rates are transparently displayed in the app.'
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  // Handle subscription
  const handleSubscribe = (planId: string) => {
    console.log(`Subscribing to ${planId} plan`);
    // Here you would redirect to Stripe checkout or an internal subscription page
    navigate(`/checkout?plan=${planId}&billing=${billingPeriod}`);
  };
  
  // Color variants for cards
  const getColorVariant = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50';
      case 'purple':
        return 'border-purple-200 bg-purple-50';
      case 'gold':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  // Icon color variants
  const getIconColorVariant = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-500';
      case 'purple':
        return 'text-purple-500';
      case 'gold':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <MobileAppLayout activeTab="pricing">
      <Helmet>
        <title>Pricing - PuntaIQ</title>
      </Helmet>
      
      <div className="mb-16 pt-2">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Choose the plan that best fits your prediction needs
          </p>
        </div>
        
        {/* Billing period toggle */}
        <div className="flex justify-center mb-6">
          <Tabs 
            value={billingPeriod} 
            onValueChange={(value) => setBillingPeriod(value as 'monthly' | 'yearly')}
            className="w-full max-w-xs"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="outline" className="ml-1 bg-green-100 text-green-700 border-green-200 text-[10px]">
                  Save 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Pricing cards */}
        <motion.div 
          className="space-y-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {pricingPlans.map((plan) => (
            <motion.div key={plan.id} variants={itemVariants}>
              <Card className={cn(
                "relative overflow-hidden border-2",
                plan.popular ? "border-primary" : "border-border",
              )}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-bl-md rounded-tr-md rounded-tl-none rounded-br-none">
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className={cn(
                  "pb-3",
                  plan.popular ? "bg-primary/5" : "bg-muted/30"
                )}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <plan.icon className={cn("h-5 w-5", getIconColorVariant(plan.color))} />
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-1.5 text-xs">
                        {plan.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-bold">{plan.currency}{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={cn(
                      "w-full", 
                      plan.popular ? "bg-primary" : "bg-primary/80"
                    )}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {user ? 'Subscribe Now' : 'Sign Up'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        {/* FAQ Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </MobileAppLayout>
  );
}