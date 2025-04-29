import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Badge as LucideBadge } from "lucide-react";
import { Award, AlertCircle, Lock, Trophy } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Badge tier types and colors
type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

const tierColors: Record<BadgeTier, string> = {
  bronze: "bg-amber-800",
  silver: "bg-slate-400",
  gold: "bg-amber-400",
  platinum: "bg-emerald-300",
  diamond: "bg-blue-400"
};

// Badge category types and icons
type BadgeCategory = 'prediction' | 'fantasy' | 'engagement' | 'achievement';

const categoryIcons: Record<BadgeCategory, React.ReactNode> = {
  prediction: <Award className="h-5 w-5" />,
  fantasy: <LucideBadge className="h-5 w-5" />,
  engagement: <AlertCircle className="h-5 w-5" />,
  achievement: <Award className="h-5 w-5" />
};

// Types for badges
interface Badge {
  id: number;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  points: number;
  requirements?: {
    description: string;
    unit?: string;
  };
  isActive: boolean;
}

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  earnedAt: string;
  isNew: boolean;
  isViewed: boolean;
  progress?: {
    current: number;
    target: number;
  };
}

interface BadgesGridProps {
  earnedBadges: UserBadge[];
  lockedBadges: Badge[];
  allBadges: Badge[];
}

interface BadgeItemProps {
  badge: Badge;
  earnedData?: UserBadge;
  isLocked?: boolean;
}

const BadgeItem = ({ badge, earnedData, isLocked = false }: BadgeItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Handle marking badge as viewed when dialog is opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    // If opening dialog and badge is new, mark as viewed
    if (open && earnedData?.isNew && user) {
      fetch(`/api/users/${user.id}/badges/${badge.id}/viewed`, {
        method: 'PATCH'
      }).catch(error => {
        console.error("Error marking badge as viewed:", error);
      });
    }
  };

  // Calculate progress percentage if badge has progress data
  const progressPercentage = earnedData?.progress 
    ? Math.min(100, Math.round((earnedData.progress.current / earnedData.progress.target) * 100))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div 
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all",
            isLocked 
              ? "bg-muted opacity-60 hover:opacity-80" 
              : "bg-card hover:shadow-md",
            earnedData?.isNew && "ring-2 ring-primary"
          )}
        >
          <div 
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3",
              isLocked ? "bg-muted" : tierColors[badge.tier] || "bg-primary"
            )}
          >
            {isLocked ? (
              <Lock className="h-8 w-8 text-muted-foreground" />
            ) : (
              <div className="text-white text-2xl">
                {categoryIcons[badge.category] || <Award className="h-8 w-8" />}
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-center">
            {badge.name}
            {earnedData?.isNew && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                New
              </span>
            )}
          </h3>
          
          {earnedData?.progress && !isLocked && (
            <div className="w-full mt-2 bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          
          {isLocked && (
            <p className="text-xs text-muted-foreground mt-1">Locked</p>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                tierColors[badge.tier] || "bg-primary"
              )}
            >
              {categoryIcons[badge.category] || <Award className="h-4 w-4 text-white" />}
            </div>
            {badge.name}
            <span className="ml-2 capitalize text-sm bg-primary/10 text-primary rounded-full px-2 py-0.5">
              {badge.tier}
            </span>
          </DialogTitle>
          <DialogDescription>
            {badge.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Requirements</h4>
            <p className="text-sm text-muted-foreground">
              {badge.requirements?.description || "Complete specific actions to earn this badge."}
            </p>
          </div>

          {earnedData && (
            <div>
              <h4 className="text-sm font-medium mb-1">Earned on</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(earnedData.earnedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {earnedData?.progress && (
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {earnedData.progress.current} / {earnedData.progress.target} {badge.requirements?.unit || "completed"}
              </p>
            </div>
          )}

          {badge.points > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Reward</h4>
              <p className="text-sm flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                {badge.points} points
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function BadgesGrid({ earnedBadges, lockedBadges, allBadges }: BadgesGridProps) {
  const [showLocked, setShowLocked] = useState(true);
  
  // Find badge details from the badges array
  const getBadgeDetails = (badgeId: number) => {
    return allBadges.find(b => b.id === badgeId);
  };

  // Map of badge ID to earned badge data
  const earnedBadgesMap = earnedBadges.reduce<Record<number, UserBadge>>((map, userBadge) => {
    map[userBadge.badgeId] = userBadge;
    return map;
  }, {});

  // Organize badges into categories
  const categories = Array.from(new Set(allBadges.map(badge => badge.category)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {earnedBadges.length} of {allBadges.length} badges earned
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLocked(!showLocked)}
        >
          {showLocked ? "Hide Locked" : "Show Locked"}
        </Button>
      </div>

      {categories.map(category => {
        const categoryBadges = allBadges.filter(badge => badge.category === category);
        const earnedCategoryBadges = categoryBadges.filter(badge => 
          earnedBadgesMap[badge.id]
        );
        
        // Skip empty categories if only showing earned badges
        if (!showLocked && earnedCategoryBadges.length === 0) {
          return null;
        }
        
        return (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-medium capitalize">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Earned badges */}
              {categoryBadges
                .filter(badge => earnedBadgesMap[badge.id])
                .map(badge => (
                  <BadgeItem 
                    key={`earned-${badge.id}`}
                    badge={badge}
                    earnedData={earnedBadgesMap[badge.id]}
                  />
                ))
              }
              
              {/* Locked badges (if showing) */}
              {showLocked && categoryBadges
                .filter(badge => !earnedBadgesMap[badge.id])
                .map(badge => (
                  <BadgeItem 
                    key={`locked-${badge.id}`}
                    badge={badge}
                    isLocked={true}
                  />
                ))
              }
            </div>
          </div>
        );
      })}

      {earnedBadges.length === 0 && !showLocked && (
        <div className="text-center py-10">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No badges earned yet</h3>
          <p className="text-muted-foreground">
            Make predictions and participate in contests to earn badges.
          </p>
        </div>
      )}
    </div>
  );
}