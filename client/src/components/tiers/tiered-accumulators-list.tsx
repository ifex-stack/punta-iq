import React, { useState } from 'react';
import { TieredAccumulatorCard } from './tiered-accumulator-card';
import { TierSelector } from './tier-selector';
import { TierLevel } from './tier-badge';
import { 
  TierCategory, 
  useTieredAccumulators,
  Accumulator
} from '@/hooks/use-tiered-accumulators';
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, Lock, Filter, LucideIcon, Layers } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface TieredAccumulatorsListProps {
  initialTier?: TierLevel | 'all';
  initialCategory?: TierCategory | 'all';
  initialSize?: number;
  showFilter?: boolean;
  showGrouping?: boolean;
  className?: string;
}

// Map TierCategory to display names
const categoryNames: Record<TierCategory, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier5: 'Tier 5',
  tier10: 'Tier 10'
};

export function TieredAccumulatorsList({
  initialTier = 'all',
  initialCategory = 'all',
  initialSize,
  showFilter = true,
  showGrouping = true,
  className
}: TieredAccumulatorsListProps) {
  const [savedAccumulators, setSavedAccumulators] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<TierCategory | 'all'>(initialCategory);
  
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  // Use the tiered accumulators hook
  const { 
    accumulators,
    accumulatorsByCategory,
    availableCategories,
    hasCategoryAccumulators,
    isLoading, 
    error,
    selectedTier, 
    setSelectedTier,
    selectedCategory,
    setSelectedCategory,
    selectedSize,
    setSelectedSize,
    refreshData,
    isPremiumUser: apiPremiumUser,
    metadata
  } = useTieredAccumulators({
    initialTier,
    initialCategory,
    initialSize
  });
  
  // Function to determine if an accumulator is accessible
  const isAccumulatorAccessible = (accumulator: Accumulator): boolean => {
    return !accumulator.isPremium || isPremiumUser;
  };
  
  // Handle saving an accumulator
  const handleSaveAccumulator = (id: string) => {
    if (savedAccumulators.includes(id)) {
      setSavedAccumulators(savedAccumulators.filter(accId => accId !== id));
      toast({
        title: "Accumulator removed",
        description: "Accumulator removed from saved list",
      });
    } else {
      setSavedAccumulators([...savedAccumulators, id]);
      toast({
        title: "Accumulator saved",
        description: "Accumulator added to your saved list",
      });
    }
  };
  
  // Handle placing a bet
  const handlePlaceBet = (id: string) => {
    toast({
      title: "Betting slip created",
      description: "Accumulator added to your betting slip",
    });
    // Implementation would connect to a betting provider
  };
  
  // Define available sizes
  const availableSizes = [2, 3, 4, 5, 6];
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading accumulators</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load accumulators. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading accumulators...</p>
      </div>
    );
  }

  // Get accumulators to display based on active category
  const getDisplayAccumulators = (): Accumulator[] => {
    if (activeCategory === 'all') {
      return accumulators;
    } else {
      return accumulatorsByCategory[activeCategory] || [];
    }
  };
  
  // Count accessible and premium accumulators
  const accessibleCount = accumulators.filter(a => isAccumulatorAccessible(a)).length;
  const premiumCount = accumulators.filter(a => a.isPremium).length;
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilter && (
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <TierSelector
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            className="w-full sm:w-auto"
          />
          
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <Select
              value={selectedSize?.toString() || ""}
              onValueChange={(value) => setSelectedSize(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sizes</SelectItem>
                {availableSizes.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}-fold
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={refreshData}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
      
      {/* Tier categories tabs */}
      {showGrouping && availableCategories.length > 0 && (
        <Tabs
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as TierCategory | 'all')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="all" className="text-xs py-1.5">
              All
            </TabsTrigger>
            {availableCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="text-xs py-1.5"
                disabled={!hasCategoryAccumulators(category)}
              >
                {categoryNames[category]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      {/* Premium access alert */}
      {!isPremiumUser && premiumCount > 0 && (
        <Alert className="bg-primary/5 border-primary/20">
          <Lock className="h-4 w-4 text-primary" />
          <AlertTitle>Premium accumulators available</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>
              {premiumCount} premium accumulators require a Pro or Elite subscription
            </span>
            <Button
              size="sm"
              onClick={() => window.location.href = "/subscription-page"}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Empty state */}
      {getDisplayAccumulators().length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No accumulators found</h3>
          <p className="text-muted-foreground mb-4">
            {activeCategory !== 'all' 
              ? `There are no ${categoryNames[activeCategory as TierCategory]} accumulators available.`
              : "There are no accumulators available with the current filters."}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTier('all');
              setActiveCategory('all');
              setSelectedSize(undefined);
              refreshData();
            }}
          >
            View all accumulators
          </Button>
        </div>
      )}
      
      {/* Accumulators list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getDisplayAccumulators().map((accumulator) => (
          <TieredAccumulatorCard
            key={accumulator.id}
            accumulator={accumulator}
            isSaved={savedAccumulators.includes(accumulator.id)}
            onSave={handleSaveAccumulator}
            onPlace={handlePlaceBet}
            isAccessible={isAccumulatorAccessible(accumulator)}
          />
        ))}
      </div>
    </div>
  );
}