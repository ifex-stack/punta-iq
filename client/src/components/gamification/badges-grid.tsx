import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Award } from "lucide-react";
import { format } from "date-fns";

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  iconUrl: string;
  requirements: string;
  createdAt: string;
}

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  awardedAt: string;
  badge?: Badge;
}

interface BadgesGridProps {
  earnedBadges: UserBadge[];
  lockedBadges: Badge[];
  allBadges: Badge[];
}

export default function BadgesGrid({ earnedBadges, lockedBadges, allBadges }: BadgesGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedUserBadge, setSelectedUserBadge] = useState<UserBadge | null>(null);

  const handleOpenEarnedBadge = (userBadge: UserBadge) => {
    const badge = allBadges.find(b => b.id === userBadge.badgeId);
    if (badge) {
      setSelectedBadge(badge);
      setSelectedUserBadge(userBadge);
    }
  };

  const handleOpenLockedBadge = (badge: Badge) => {
    setSelectedBadge(badge);
    setSelectedUserBadge(null);
  };

  const handleCloseDialog = () => {
    setSelectedBadge(null);
    setSelectedUserBadge(null);
  };

  // Get badge color based on tier
  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-700';
      case 'silver':
        return 'bg-slate-400';
      case 'gold':
        return 'bg-amber-400';
      case 'platinum':
        return 'bg-cyan-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Earned Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {earnedBadges.map((userBadge) => {
              const badge = allBadges.find(b => b.id === userBadge.badgeId);
              if (!badge) return null;
              return (
                <div 
                  key={userBadge.id}
                  className="relative group cursor-pointer rounded-lg border p-4 flex flex-col items-center space-y-3 transition-all hover:shadow-md"
                  onClick={() => handleOpenEarnedBadge(userBadge)}
                >
                  <div className={`p-2 rounded-full ${getBadgeColor(badge.tier)}`}>
                    {badge.iconUrl ? (
                      <img 
                        src={badge.iconUrl} 
                        alt={badge.name} 
                        className="h-12 w-12"
                      />
                    ) : (
                      <Award className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-sm">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned {format(new Date(userBadge.awardedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {lockedBadges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Available Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {lockedBadges.map((badge) => (
              <div 
                key={badge.id}
                className="relative group cursor-pointer rounded-lg border p-4 flex flex-col items-center space-y-3 transition-all hover:shadow-md opacity-70 hover:opacity-100"
                onClick={() => handleOpenLockedBadge(badge)}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className={`p-2 rounded-full bg-gray-200`}>
                  {badge.iconUrl ? (
                    <img 
                      src={badge.iconUrl} 
                      alt={badge.name} 
                      className="h-12 w-12 grayscale"
                    />
                  ) : (
                    <Award className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {badge.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge detail dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedBadge?.name}</DialogTitle>
            <DialogDescription>
              {selectedUserBadge ? 'You earned this badge!' : 'Keep working to earn this badge'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className={`p-3 rounded-full ${selectedBadge ? getBadgeColor(selectedBadge.tier) : 'bg-gray-200'}`}>
              {selectedBadge?.iconUrl ? (
                <img 
                  src={selectedBadge.iconUrl} 
                  alt={selectedBadge.name} 
                  className={`h-16 w-16 ${!selectedUserBadge ? 'grayscale' : ''}`}
                />
              ) : (
                <Award className={`h-16 w-16 ${selectedUserBadge ? 'text-white' : 'text-muted-foreground'}`} />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{selectedBadge?.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
              
              {selectedUserBadge && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm">
                    <span className="font-medium">Earned on:</span>{' '}
                    {format(new Date(selectedUserBadge.awardedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
              
              {!selectedUserBadge && selectedBadge && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium">Requirements:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.requirements}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleCloseDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}