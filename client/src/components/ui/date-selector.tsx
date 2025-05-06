import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, isWeekend } from 'date-fns';

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function DateSelector({ selectedDate, onSelectDate, className }: DateSelectorProps) {
  const today = new Date();
  
  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  // Format labels for quick access buttons
  const getTodayLabel = () => 'Today';
  const getTomorrowLabel = () => 'Tomorrow';
  const getWeekendLabel = () => 'Weekend';
  
  // Check if selected date is a weekend date
  const isWeekendSelected = isWeekend(selectedDate);
  
  // Check if weekend days are within the next 7 days
  const weekendDates = dates.filter(date => isWeekend(date));
  const hasWeekend = weekendDates.length > 0;
  
  return (
    <div className={cn("flex w-full overflow-x-auto py-2 px-3 no-scrollbar", className)}>
      <div className="flex space-x-2">
        {/* Today */}
        <DateButton 
          label={getTodayLabel()}
          isSelected={isSameDay(selectedDate, today)}
          onClick={() => onSelectDate(today)}
        />
        
        {/* Tomorrow */}
        <DateButton 
          label={getTomorrowLabel()}
          isSelected={isSameDay(selectedDate, addDays(today, 1))}
          onClick={() => onSelectDate(addDays(today, 1))}
        />
        
        {/* Weekend */}
        {hasWeekend && (
          <DateButton 
            label={getWeekendLabel()}
            isSelected={isWeekendSelected}
            onClick={() => onSelectDate(weekendDates[0])}
          />
        )}
        
        {/* Specific dates */}
        {dates.slice(2).map((date) => (
          <DateButton 
            key={date.toISOString()}
            label={format(date, 'EEE d')}
            isSelected={isSameDay(selectedDate, date)}
            onClick={() => onSelectDate(date)}
          />
        ))}
      </div>
    </div>
  );
}

interface DateButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function DateButton({ label, isSelected, onClick }: DateButtonProps) {
  return (
    <motion.button
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap focus:outline-none transition-colors",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}

export default DateSelector;