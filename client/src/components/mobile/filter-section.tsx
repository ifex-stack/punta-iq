import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FilterItem {
  id: string;
  label: string;
}

interface FilterSectionProps {
  selectedSports: string[];
  onSportToggle: (sportId: string) => void;
  availableSports: FilterItem[];
  selectedMarkets: string[];
  onMarketToggle: (marketId: string) => void;
  availableMarkets: FilterItem[];
}

export function FilterSection({
  selectedSports,
  onSportToggle,
  availableSports,
  selectedMarkets,
  onMarketToggle,
  availableMarkets,
}: FilterSectionProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Sports filter */}
      {availableSports.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">Sports</p>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              {availableSports.map(sport => (
                <motion.div key={sport.id} variants={itemVariants}>
                  <Button
                    size="sm"
                    variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                    className={cn(
                      "rounded-full text-xs h-8 px-3",
                      selectedSports.includes(sport.id) && "bg-primary"
                    )}
                    onClick={() => onSportToggle(sport.id)}
                  >
                    {sport.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Markets filter */}
      {availableMarkets.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">Markets</p>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              {availableMarkets.map(market => (
                <motion.div key={market.id} variants={itemVariants}>
                  <Button
                    size="sm"
                    variant={selectedMarkets.includes(market.id) ? "default" : "outline"}
                    className={cn(
                      "rounded-full text-xs h-8 px-3", 
                      selectedMarkets.includes(market.id) && "bg-primary"
                    )}
                    onClick={() => onMarketToggle(market.id)}
                  >
                    {market.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </motion.div>
  );
}