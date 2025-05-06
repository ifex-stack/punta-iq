import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
}

interface SportFilterProps {
  selectedSports: string[];
  onSportToggle: (sportId: string) => void;
  availableSports: FilterOption[];
  selectedMarkets: string[];
  onMarketToggle: (marketId: string) => void;
  availableMarkets: FilterOption[];
}

export function FilterSection({
  selectedSports,
  onSportToggle,
  availableSports,
  selectedMarkets,
  onMarketToggle,
  availableMarkets
}: SportFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'markets' | 'all'>('all');

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={toggleExpansion}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          
          <Button 
            variant={activeTab === 'all' ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab('all')}
            className="h-8"
          >
            All
          </Button>
          
          <Button 
            variant={activeTab === 'markets' ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab('markets')}
            className="h-8"
          >
            Markets
          </Button>
        </div>
        
        {(selectedSports.length > 0 || selectedMarkets.length > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              selectedSports.forEach(sport => onSportToggle(sport));
              selectedMarkets.forEach(market => onMarketToggle(market));
            }}
            className="h-8 text-xs"
          >
            Reset
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-2">
              {activeTab === 'all' && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Sports</p>
                  <div className="flex flex-wrap gap-1">
                    {availableSports.map(sport => (
                      <Badge
                        key={sport.id}
                        variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer hover:bg-primary/90",
                          selectedSports.includes(sport.id) ? "" : "hover:bg-muted hover:text-primary"
                        )}
                        onClick={() => onSportToggle(sport.id)}
                      >
                        {sport.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Markets</p>
                <div className="flex flex-wrap gap-1">
                  {availableMarkets.map(market => (
                    <Badge
                      key={market.id}
                      variant={selectedMarkets.includes(market.id) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer hover:bg-primary/90",
                        selectedMarkets.includes(market.id) ? "" : "hover:bg-muted hover:text-primary"
                      )}
                      onClick={() => onMarketToggle(market.id)}
                    >
                      {market.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterSection;