import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

interface Sport {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  iconName: string;
}

interface SportsTabsProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
}

export function SportsTabs({ selectedSport, onSelectSport }: SportsTabsProps) {
  const { data: sports, isLoading } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });

  const handleChange = (value: string) => {
    onSelectSport(value);
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto py-2">
        <div className="flex space-x-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="h-9 w-24 bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  // If we don't have any sports, show a default "All" tab
  const displaySports = sports?.length 
    ? [{ id: 0, name: "All", slug: "all", isActive: true, iconName: "globe" }, ...sports]
    : [{ id: 0, name: "All", slug: "all", isActive: true, iconName: "globe" }];

  return (
    <div className="w-full overflow-x-auto py-2">
      <Tabs value={selectedSport} onValueChange={handleChange} className="w-max">
        <TabsList>
          {displaySports.map((sport) => (
            <TabsTrigger key={sport.id} value={sport.slug}>
              {sport.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export default SportsTabs;