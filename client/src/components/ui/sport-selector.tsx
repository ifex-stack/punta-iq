import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { SiPremierleague, SiNba } from "react-icons/si";
import {
  Dribbble,
  Trophy,
  CircleDot,
  Dumbbell,
  StickyNote,
  Snowflake,
  Circle,
  Bike
} from 'lucide-react';

interface SportSelectorProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  className?: string;
  showAll?: boolean;
}

export function SportSelector({ 
  selectedSport, 
  onSelectSport, 
  className,
  showAll = true
}: SportSelectorProps) {
  const sports = [
    ...(showAll ? [{ id: 'all', label: 'All Sports', icon: Trophy }] : []),
    { id: 'football', label: 'Football', icon: SiPremierleague },
    { id: 'basketball', label: 'Basketball', icon: Dribbble },
    { id: 'tennis', label: 'Tennis', icon: CircleDot },
    { id: 'baseball', label: 'Baseball', icon: StickyNote },
    { id: 'hockey', label: 'Hockey', icon: Snowflake },
    { id: 'golf', label: 'Golf', icon: Circle },
    { id: 'cycling', label: 'Cycling', icon: Bike },
    { id: 'mma', label: 'MMA', icon: Dumbbell },
  ];

  return (
    <div className={cn("w-full overflow-x-auto py-2 px-3 no-scrollbar", className)}>
      <div className="flex space-x-3">
        {sports.map((sport) => {
          const isSelected = selectedSport === sport.id;
          const Icon = sport.icon;
          
          return (
            <SportButton 
              key={sport.id}
              label={sport.label}
              icon={<Icon className="mr-1 h-4 w-4" />}
              isSelected={isSelected}
              onClick={() => onSelectSport(sport.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SportButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function SportButton({ label, icon, isSelected, onClick }: SportButtonProps) {
  return (
    <motion.button
      className={cn(
        "flex items-center rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap focus:outline-none transition-colors",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

export default SportSelector;