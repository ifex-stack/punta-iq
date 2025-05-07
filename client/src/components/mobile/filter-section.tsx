import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Filter, X, Check } from 'lucide-react';

export interface FilterOptions {
  sports: string[];
  confidenceLevel: number;
  premiumOnly: boolean;
  sortBy: 'time' | 'confidence' | 'odds';
}

interface FilterSectionProps {
  onFilterChange: (filters: FilterOptions) => void;
  onReset?: () => void;
  className?: string;
}

export function FilterSection({ 
  onFilterChange, 
  onReset,
  className 
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sports: ['football', 'basketball'],
    confidenceLevel: 50,
    premiumOnly: false,
    sortBy: 'time'
  });
  
  const toggleFilter = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSportToggle = (sport: string) => {
    const updatedSports = filters.sports.includes(sport)
      ? filters.sports.filter(s => s !== sport)
      : [...filters.sports, sport];
    
    const updatedFilters: FilterOptions = {
      ...filters,
      sports: updatedSports
    };
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  const handleConfidenceChange = (value: number[]) => {
    const updatedFilters: FilterOptions = {
      ...filters,
      confidenceLevel: value[0]
    };
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  const handlePremiumToggle = (checked: boolean) => {
    const updatedFilters: FilterOptions = {
      ...filters,
      premiumOnly: checked
    };
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  const handleSortChange = (value: string) => {
    // Ensure the sort value is one of the allowed types
    const sortValue = (value === 'time' || value === 'confidence' || value === 'odds') 
      ? value 
      : 'time';
      
    const updatedFilters: FilterOptions = {
      ...filters,
      sortBy: sortValue
    };
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      sports: ['football', 'basketball'],
      confidenceLevel: 50,
      premiumOnly: false,
      sortBy: 'time'
    };
    
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    
    if (onReset) {
      onReset();
    }
  };
  
  // Filter button animations
  const buttonVariants = {
    active: {
      backgroundColor: "rgb(var(--primary) / 0.1)",
      borderColor: "rgb(var(--primary) / 0.5)",
      color: "rgb(var(--primary))",
      scale: 1.05,
      y: -2
    },
    inactive: {
      backgroundColor: "rgb(var(--muted) / 0.5)",
      borderColor: "rgb(var(--border) / 0.2)",
      color: "rgb(var(--muted-foreground))",
      scale: 1,
      y: 0
    }
  };
  
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <Button
          onClick={toggleFilter}
          variant={isOpen ? "secondary" : "outline"}
          size="sm"
          className="gap-1"
        >
          <Filter size={14} />
          <span>Filters</span>
          {filters.sports.length !== 2 || 
           filters.confidenceLevel !== 50 || 
           filters.premiumOnly || 
           filters.sortBy !== 'time' ? (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center ml-1">
              <Check size={10} />
            </Badge>
          ) : null}
        </Button>
        
        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
        >
          Reset
        </Button>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-4">
              {/* Sports Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sports</Label>
                <div className="flex gap-2 flex-wrap">
                  {['football', 'basketball', 'tennis', 'baseball', 'hockey'].map(sport => (
                    <motion.button
                      key={sport}
                      onClick={() => handleSportToggle(sport)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs border transition-all",
                        "transform perspective-800"
                      )}
                      initial="inactive"
                      animate={filters.sports.includes(sport) ? "active" : "inactive"}
                      variants={buttonVariants}
                      whileTap={{ scale: 0.95 }}
                    >
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Confidence Level */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">Minimum Confidence</Label>
                  <Badge variant="outline">{filters.confidenceLevel}%</Badge>
                </div>
                <Slider
                  defaultValue={[filters.confidenceLevel]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={handleConfidenceChange}
                  className="py-4"
                />
              </div>
              
              <Separator />
              
              {/* Premium Filter */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Premium Picks Only</Label>
                  <p className="text-xs text-muted-foreground">Show higher quality predictions</p>
                </div>
                <Switch 
                  checked={filters.premiumOnly}
                  onCheckedChange={handlePremiumToggle}
                />
              </div>
              
              <Separator />
              
              {/* Sort Options */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <RadioGroup 
                  value={filters.sortBy} 
                  onValueChange={handleSortChange}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time" id="time" />
                    <Label htmlFor="time" className="text-sm">Match Time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="confidence" id="confidence" />
                    <Label htmlFor="confidence" className="text-sm">Confidence Level</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="odds" id="odds" />
                    <Label htmlFor="odds" className="text-sm">Odds Value</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button onClick={toggleFilter} variant="outline" size="sm" className="w-full mt-2">
                Apply Filters
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterSection;