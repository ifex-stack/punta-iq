import { ScrollArea } from "@/components/ui/scroll-area";
import { Sport } from "@shared/schema";

interface SportTabsProps {
  sports: Sport[];
  activeSportId: number;
  onSelect: (sportId: number) => void;
}

const SportsTabs = ({ sports, activeSportId, onSelect }: SportTabsProps) => {
  // Function to get icon component
  const getSportIcon = (iconName: string) => {
    return iconName.replace('fa-', '');
  };
  
  return (
    <ScrollArea className="w-full">
      <div className="flex overflow-x-auto pb-2 no-scrollbar">
        {sports.map((sport) => (
          <button
            key={sport.id}
            className={`sport-tab whitespace-nowrap px-4 py-2 mr-3 text-sm font-medium rounded-full
              ${activeSportId === sport.id 
                ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                : 'bg-card text-muted-foreground'
              }`}
            onClick={() => onSelect(sport.id)}
          >
            <i className={`fas ${sport.icon} mr-1`}></i> {sport.name}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SportsTabs;
