import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Lock } from "lucide-react";

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  requirements: any;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  awardedAt: string;
  isNew?: boolean;
  badge?: Badge;
}

interface BadgesGridProps {
  earnedBadges: UserBadge[];
  lockedBadges: Badge[];
  allBadges: Badge[];
}

export default function BadgesGrid({ earnedBadges, lockedBadges, allBadges }: BadgesGridProps) {
  const [selectedEarnedBadge, setSelectedEarnedBadge] = useState<UserBadge | null>(null);
  const [selectedLockedBadge, setSelectedLockedBadge] = useState<Badge | null>(null);

  // Find the badge details for each user badge
  const earnedBadgesWithDetails = earnedBadges.map(userBadge => {
    const badge = allBadges.find(badge => badge.id === userBadge.badgeId);
    return { ...userBadge, badge };
  });

  const handleOpenEarnedBadge = (userBadge: UserBadge) => {
    setSelectedEarnedBadge(userBadge);
  };

  const handleOpenLockedBadge = (badge: Badge) => {
    setSelectedLockedBadge(badge);
  };

  const getBadgeTierColor = (tier: string) => {
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
        return 'bg-slate-300';
    }
  };

  const getIconForBadge = (icon: string) => {
    // This is a simplified version - in a real app, you'd have a mapping of icons
    return <Award className="h-10 w-10" />;
  };

  return (
    <div>
      {/* Earned Badges Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Earned Badges ({earnedBadgesWithDetails.length})</h3>
        {earnedBadgesWithDetails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You haven't earned any badges yet. Start making predictions to earn your first badge!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadgesWithDetails.map(userBadge => (
              <Card 
                key={userBadge.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenEarnedBadge(userBadge)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-center">
                    <div className={`rounded-full p-3 ${getBadgeTierColor(userBadge.badge?.tier || 'bronze')}`}>
                      {getIconForBadge(userBadge.badge?.icon || 'award')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-center">
                  <h4 className="font-semibold">{userBadge.badge?.name || 'Badge'}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {userBadge.badge?.description || 'Badge description'}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Badge variant="outline" className="capitalize">{userBadge.badge?.tier || 'bronze'}</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Locked Badges ({lockedBadges.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lockedBadges.map(badge => (
            <Card 
              key={badge.id} 
              className="cursor-pointer hover:shadow-md transition-shadow opacity-70 hover:opacity-90"
              onClick={() => handleOpenLockedBadge(badge)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-center relative">
                  <div className="rounded-full p-3 bg-gray-300">
                    {getIconForBadge(badge.icon)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-center">
                <h4 className="font-semibold">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {badge.description}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-center">
                <Badge variant="outline" className="capitalize">{badge.tier}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog for Earned Badge */}
      <Dialog 
        open={!!selectedEarnedBadge} 
        onOpenChange={open => !open && setSelectedEarnedBadge(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEarnedBadge?.badge?.name}</DialogTitle>
            <DialogDescription>
              {selectedEarnedBadge?.badge?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className={`rounded-full p-5 mb-4 ${getBadgeTierColor(selectedEarnedBadge?.badge?.tier || 'bronze')}`}>
              {getIconForBadge(selectedEarnedBadge?.badge?.icon || 'award')}
            </div>
            <div className="text-center space-y-2">
              <p><strong>Category:</strong> {selectedEarnedBadge?.badge?.category}</p>
              <p><strong>Points Earned:</strong> {selectedEarnedBadge?.badge?.points}</p>
              <p><strong>Earned On:</strong> {new Date(selectedEarnedBadge?.awardedAt || '').toLocaleDateString()}</p>
              <Badge className="capitalize mt-2">{selectedEarnedBadge?.badge?.tier} tier</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Locked Badge */}
      <Dialog 
        open={!!selectedLockedBadge} 
        onOpenChange={open => !open && setSelectedLockedBadge(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedLockedBadge?.name}</DialogTitle>
            <DialogDescription>
              Here's how to earn this badge
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="rounded-full p-5 mb-4 bg-gray-200 relative">
              {getIconForBadge(selectedLockedBadge?.icon || 'award')}
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-8 w-8 text-gray-700" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p>{selectedLockedBadge?.description}</p>
              <p className="font-medium mt-2">Requirements:</p>
              <div className="bg-gray-100 p-3 rounded-md text-sm">
                {selectedLockedBadge?.requirements?.type === 'prediction_count' && (
                  <p>Make {selectedLockedBadge.requirements.count} predictions</p>
                )}
                {selectedLockedBadge?.requirements?.type === 'login_streak' && (
                  <p>Log in for {selectedLockedBadge.requirements.days} consecutive days</p>
                )}
                {selectedLockedBadge?.requirements?.type === 'accumulator_created' && (
                  <p>Create {selectedLockedBadge.requirements.count} accumulator prediction</p>
                )}
                {selectedLockedBadge?.requirements?.type === 'fantasy_contest_win' && (
                  <p>Win {selectedLockedBadge.requirements.count} fantasy football contest</p>
                )}
              </div>
              <p><strong>Points Value:</strong> {selectedLockedBadge?.points}</p>
              <Badge className="capitalize mt-2">{selectedLockedBadge?.tier} tier</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}