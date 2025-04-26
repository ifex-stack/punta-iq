import React from "react";
import { cn } from "@/lib/utils";
import { CircleUser, BellRing, CircleDot, Shirt, Flag, Dumbbell, Trophy } from "lucide-react";

interface SportTabProps {
  sport: string;
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: (sport: string) => void;
}

const SportTab: React.FC<SportTabProps> = ({ sport, label, icon, isSelected, onClick }) => {
  return (
    <button
      onClick={() => onClick(sport)}
      className={cn(
        "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
};

interface SportTabsProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  className?: string;
}

const SportsTabs: React.FC<SportTabsProps> = ({
  selectedSport,
  onSelectSport,
  className,
}) => {
  const sportOptions = [
    { id: "all", label: "All Sports", icon: <Trophy className="h-4 w-4" /> },
    { id: "football", label: "Football", icon: <CircleUser className="h-4 w-4" /> },
    { id: "basketball", label: "Basketball", icon: <BellRing className="h-4 w-4" /> },
    { id: "tennis", label: "Tennis", icon: <CircleDot className="h-4 w-4" /> },
    { id: "baseball", label: "Baseball", icon: <Shirt className="h-4 w-4" /> },
    { id: "hockey", label: "Hockey", icon: <Flag className="h-4 w-4" /> },
    { id: "other", label: "Other", icon: <Dumbbell className="h-4 w-4" /> },
  ];

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {sportOptions.map((sport) => (
        <SportTab
          key={sport.id}
          sport={sport.id}
          label={sport.label}
          icon={sport.icon}
          isSelected={selectedSport === sport.id}
          onClick={onSelectSport}
        />
      ))}
    </div>
  );
};

export default SportsTabs;