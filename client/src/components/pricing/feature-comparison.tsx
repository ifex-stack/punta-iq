import React from 'react';
import { Check, X, Minus, AlertCircle } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Feature {
  name: string;
  description: string;
  tiers: {
    basic: 'full' | 'limited' | 'none';
    pro: 'full' | 'limited' | 'none';
    elite: 'full' | 'limited' | 'none';
  };
}

interface FeatureCategory {
  name: string;
  features: Feature[];
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  isPopular?: boolean;
}

interface FeatureComparisonProps {
  selectedInterval: 'month' | 'year';
  onSubscribe: (planId: string) => void;
  currentPlanId?: string;
}

export function FeatureComparison({ 
  selectedInterval, 
  onSubscribe,
  currentPlanId
}: FeatureComparisonProps) {
  // Define pricing tiers
  const pricingTiers: PricingTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: selectedInterval === 'month' ? 7.99 : 79.99,
      currency: '£',
      interval: selectedInterval,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: selectedInterval === 'month' ? 14.99 : 149.99,
      currency: '£',
      interval: selectedInterval,
      isPopular: true,
    },
    {
      id: 'elite',
      name: 'Elite',
      price: selectedInterval === 'month' ? 29.99 : 299.99,
      currency: '£',
      interval: selectedInterval,
    }
  ];

  // Define feature categories and features with their availability in each tier
  const featureCategories: FeatureCategory[] = [
    {
      name: 'Predictions',
      features: [
        {
          name: 'Daily AI Predictions',
          description: 'Access to daily match predictions powered by our AI',
          tiers: { basic: 'limited', pro: 'full', elite: 'full' }
        },
        {
          name: 'Multi-Sport Coverage',
          description: 'Predictions across different sports categories',
          tiers: { basic: 'limited', pro: 'full', elite: 'full' }
        },
        {
          name: 'Premium Predictions',
          description: 'Higher confidence level predictions with detailed analysis',
          tiers: { basic: 'none', pro: 'limited', elite: 'full' }
        },
        {
          name: 'VIP Predictions',
          description: 'Exclusive high-value betting opportunities',
          tiers: { basic: 'none', pro: 'none', elite: 'full' }
        },
        {
          name: 'Live Match Updates',
          description: 'Real-time updates and in-play prediction adjustments',
          tiers: { basic: 'none', pro: 'limited', elite: 'full' }
        }
      ]
    },
    {
      name: 'Analytics & Insights',
      features: [
        {
          name: 'Basic Win/Loss Stats',
          description: 'Simple statistics on prediction outcomes',
          tiers: { basic: 'full', pro: 'full', elite: 'full' }
        },
        {
          name: 'Advanced Stats & Analytics',
          description: 'Detailed statistical analysis and performance metrics',
          tiers: { basic: 'none', pro: 'full', elite: 'full' }
        },
        {
          name: 'Historical Data Access',
          description: 'Access to past predictions and performance insights',
          tiers: { basic: 'limited', pro: 'full', elite: 'full' }
        },
        {
          name: 'Expert Analysis',
          description: 'Detailed analysis from sports prediction experts',
          tiers: { basic: 'none', pro: 'none', elite: 'full' }
        },
        {
          name: 'Performance Tracking',
          description: 'Track your betting performance over time',
          tiers: { basic: 'limited', pro: 'full', elite: 'full' }
        }
      ]
    },
    {
      name: 'Special Features',
      features: [
        {
          name: 'Accumulators',
          description: 'AI-powered accumulator suggestions',
          tiers: { basic: 'limited', pro: 'full', elite: 'full' }
        },
        {
          name: 'Enhanced Accumulators',
          description: 'Premium accumulator selections with higher expected value',
          tiers: { basic: 'none', pro: 'limited', elite: 'full' }
        },
        {
          name: 'Custom Notifications',
          description: 'Personalized alerts for matches and predictions',
          tiers: { basic: 'none', pro: 'limited', elite: 'full' }
        },
        {
          name: 'Odds Comparison',
          description: 'Compare odds across different bookmakers',
          tiers: { basic: 'none', pro: 'limited', elite: 'full' }
        },
        {
          name: 'Betting Strategy Tools',
          description: 'Advanced tools to optimize your betting strategy',
          tiers: { basic: 'none', pro: 'none', elite: 'full' }
        }
      ]
    },
    {
      name: 'Customer Support',
      features: [
        {
          name: 'Email Support',
          description: 'Support via email',
          tiers: { basic: 'full', pro: 'full', elite: 'full' }
        },
        {
          name: 'Priority Support',
          description: 'Fast-track support response',
          tiers: { basic: 'none', pro: 'full', elite: 'full' }
        },
        {
          name: 'Phone Support',
          description: 'Direct phone line to customer service',
          tiers: { basic: 'none', pro: 'none', elite: 'full' }
        }
      ]
    }
  ];

  // Function to render the appropriate icon for each feature tier
  const renderTierIcon = (tier: 'full' | 'limited' | 'none') => {
    switch (tier) {
      case 'full':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'limited':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Minus className="h-5 w-5 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">Limited access</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'none':
        return <X className="h-5 w-5 text-muted-foreground/50" />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Complete Feature Comparison</h2>
      
      {/* Desktop view - Full table for larger screens */}
      <div className="rounded-lg border overflow-hidden hidden md:block">
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/80 backdrop-blur-sm">
                <TableHead className="w-[250px]">Feature</TableHead>
                {pricingTiers.map((tier) => (
                  <TableHead key={tier.id} className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{tier.name}</span>
                      <div className="flex items-baseline mt-1">
                        <span className="text-xl font-bold">{tier.currency}{tier.price}</span>
                        <span className="text-xs text-muted-foreground ml-1">/{tier.interval}</span>
                      </div>
                      {tier.isPopular && (
                        <Badge variant="outline" className="mt-1 bg-primary/10 text-primary">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {featureCategories.map((category, categoryIndex) => (
                <React.Fragment key={category.name}>
                  <TableRow className="bg-accent/5">
                    <TableCell colSpan={4} className="font-medium py-2">
                      {category.name}
                    </TableCell>
                  </TableRow>
                  
                  {category.features.map((feature, featureIndex) => (
                    <TableRow 
                      key={`${categoryIndex}-${featureIndex}`}
                      className={featureIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      <TableCell className="font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help">
                              {feature.name}
                              <AlertCircle className="h-3 w-3 text-muted-foreground/70" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[200px]">{feature.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderTierIcon(feature.tiers.basic)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderTierIcon(feature.tiers.pro)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderTierIcon(feature.tiers.elite)}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="border-t bg-muted/10 p-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center pl-4">Choose your plan</div>
            {pricingTiers.map((tier) => (
              <div key={tier.id} className="text-center">
                <Button 
                  variant={tier.isPopular ? "default" : "outline"}
                  onClick={() => onSubscribe(tier.id)}
                  disabled={currentPlanId === tier.id}
                  className="w-full"
                >
                  {currentPlanId === tier.id ? 'Current Plan' : 'Subscribe'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile view - Card-based layout for small screens */}
      <div className="md:hidden space-y-4">
        {pricingTiers.map((tier) => (
          <div 
            key={tier.id} 
            className={`rounded-lg border ${tier.isPopular ? 'border-primary/40 bg-primary/5' : 'border-border'} p-4 relative overflow-hidden`}
          >
            {tier.isPopular && (
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rotate-45 translate-x-2 translate-y-3">
                  Popular
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <div className="flex items-baseline">
                <span className="text-xl font-bold">{tier.currency}{tier.price}</span>
                <span className="text-xs text-muted-foreground ml-1">/{tier.interval}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {featureCategories.map((category) => {
                // Filter to see if this category has any available features for this tier
                const availableFeatures = category.features.filter(
                  feature => feature.tiers[tier.id as keyof typeof feature.tiers] !== 'none'
                );
                
                // Skip category if no features are available
                if (availableFeatures.length === 0) return null;
                
                return (
                  <div key={category.name} className="space-y-2">
                    <h4 className="text-sm font-semibold border-b pb-1">{category.name}</h4>
                    <ul className="space-y-2 text-sm">
                      {availableFeatures.map((feature) => {
                        const tierValue = feature.tiers[tier.id as keyof typeof feature.tiers];
                        
                        return (
                          <li 
                            key={feature.name} 
                            className="flex justify-between items-center"
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-help text-left">
                                  <span>{feature.name}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">{feature.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>
                              {tierValue === 'full' 
                                ? <Check className="h-4 w-4 text-green-500" /> 
                                : <Minus className="h-4 w-4 text-amber-500" />
                              }
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
            
            <Button 
              variant={tier.isPopular ? "default" : "outline"}
              onClick={() => onSubscribe(tier.id)}
              disabled={currentPlanId === tier.id}
              className="w-full mt-6"
            >
              {currentPlanId === tier.id ? 'Current Plan' : 'Subscribe'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}