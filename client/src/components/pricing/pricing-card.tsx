import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  discountPercentage?: number;
  onSubscribe: (planId: string) => void;
  isCurrentPlan?: boolean;
  className?: string;
  isPremium?: boolean;
}

export function PricingCard({
  id,
  name,
  price,
  currency,
  interval,
  features,
  isPopular,
  discountPercentage,
  onSubscribe,
  isCurrentPlan,
  className = '',
  isPremium
}: PricingCardProps) {
  // Animation variants
  const hoverEffect = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -5 }
  };
  
  // Get gradient based on tier
  const getGradient = () => {
    if (name === 'Elite') return 'from-primary/10 via-accent/10 to-secondary/10';
    if (name === 'Pro') return 'from-primary/10 to-secondary/10';
    return 'from-muted/10 to-muted/5';
  };
  
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={hoverEffect}
      transition={{ duration: 0.3, type: 'tween' }}
      className={className}
    >
      <Card 
        className={`h-full relative overflow-hidden ${isPopular ? 'border-primary border-2' : ''}`}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
              Most Popular
            </span>
          </div>
        )}
        
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-50`}></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <span>{name}</span>
            {isCurrentPlan && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs">
                Current Plan
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-baseline mt-2">
            <span className="text-3xl font-bold">{currency}{price}</span>
            <span className="text-muted-foreground ml-1">/{interval}</span>
          </div>
          
          {discountPercentage && interval === 'year' && (
            <span className="inline-block bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-full mt-1">
              Save {discountPercentage}%
            </span>
          )}
          
          <CardDescription className="mt-2">
            {name === 'Basic' && 'Essential predictions for casual fans'}
            {name === 'Pro' && 'Advanced insights for serious bettors'}
            {name === 'Elite' && 'Premium experience with exclusive features'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter className="relative z-10">
          <Button 
            className="w-full group"
            variant={isPopular ? "default" : "outline"}
            onClick={() => onSubscribe(id)}
            disabled={isCurrentPlan}
          >
            {isCurrentPlan ? 'Current Plan' : (
              <span className="flex items-center justify-center w-full">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}