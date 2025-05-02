import { useState, FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Twitter, Facebook, Linkedin, Instagram, Medal, Share2, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface SocialBoostProps {
  className?: string;
  referralCode: string;
  referralUrl: string;
}

interface SocialAction {
  platform: string;
  label: string;
  points: number;
  icon: React.ReactNode;
  shareUrl: (referralUrl: string, message: string) => string;
  disabled?: boolean;
}

export const SocialBoost: FC<SocialBoostProps> = ({ className, referralCode, referralUrl }) => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<SocialAction | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  
  // Get the base URL for sharing (dynamically)
  const appUrl = `https://puntaiq.com`;
  const shareMessage = `I'm using PuntaIQ for AI-powered sports predictions. Join using my referral code ${referralCode} and get exclusive bonuses! #PuntaIQ #SportsPredictions`;
  
  // Define social sharing platforms
  const socialActions: SocialAction[] = [
    {
      platform: "twitter",
      label: "Twitter/X",
      points: 150,
      icon: <Twitter className="h-5 w-5 text-[#1DA1F2]" />,
      shareUrl: (url, message) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`,
    },
    {
      platform: "facebook",
      label: "Facebook",
      points: 100,
      icon: <Facebook className="h-5 w-5 text-[#4267B2]" />,
      shareUrl: (url, message) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      points: 200,
      icon: <Linkedin className="h-5 w-5 text-[#0077B5]" />,
      shareUrl: (url, message) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(message)}`,
    },
    {
      platform: "instagram",
      label: "Instagram",
      points: 100,
      icon: <Instagram className="h-5 w-5 text-[#E1306C]" />,
      shareUrl: (url, message) => `https://instagram.com`,
      disabled: true, // Instagram doesn't support direct sharing via URL
    },
  ];

  // Track social share
  const trackSocialShareMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", "/api/referrals/track-share", {
        platform,
        referralCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update completed actions
      setCompletedActions((prev) => [...prev, selectedAction?.platform || ""]);
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
      
      // Show toast with points earned
      toast({
        title: "Social Media Share Tracked!",
        description: `You earned ${data.pointsEarned} points for sharing on ${selectedAction?.label}.`,
        action: (
          <ToastAction altText="View" onClick={() => {}}>
            View
          </ToastAction>
        ),
      });
      
      setOpenDialog(false);
    },
    onError: () => {
      toast({
        title: "Share Tracking Failed",
        description: "Unable to track your share. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle share click
  const handleShareClick = (action: SocialAction) => {
    setSelectedAction(action);
    
    // If disabled, just show a message
    if (action.disabled) {
      toast({
        title: "Direct Sharing Not Available",
        description: `${action.label} doesn't support direct sharing. Please share your referral link manually.`,
        variant: "default",
      });
      return;
    }
    
    // Open share dialog
    window.open(action.shareUrl(referralUrl, shareMessage), "_blank", "width=600,height=400");
    setOpenDialog(true);
  };

  // Confirm share
  const confirmShare = () => {
    if (selectedAction) {
      trackSocialShareMutation.mutate(selectedAction.platform);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Social Media Boost
        </CardTitle>
        <CardDescription>
          Share your referral link and earn extra points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="bg-primary/10 border-primary/30">
          <Medal className="h-4 w-4 text-primary" />
          <AlertTitle>Boost Your Rewards</AlertTitle>
          <AlertDescription>
            Share on social media to earn bonus points and increase your referral visibility.
            Different platforms offer different point values!
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {socialActions.map((action) => (
            <Button
              key={action.platform}
              variant="outline"
              className={`flex items-center justify-start gap-2 h-auto py-3 px-4 relative ${
                completedActions.includes(action.platform) ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : ''
              } ${action.disabled ? 'opacity-60' : ''}`}
              onClick={() => handleShareClick(action)}
              disabled={action.disabled}
            >
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                {action.icon}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">+{action.points} points</p>
              </div>
              {completedActions.includes(action.platform) && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <h3 className="text-sm font-medium">Sharing Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary" />
              <span>Share on different platforms for maximum points</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary" />
              <span>Include personal experiences with predictions for better conversions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary" />
              <span>Share during peak hours (evenings and weekends) to reach more people</span>
            </li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center bg-slate-50 dark:bg-slate-900/50 py-3 px-4 text-xs text-muted-foreground">
        You can earn points for each unique platform share every 24 hours
      </CardFooter>

      {/* Verification Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Share</DialogTitle>
            <DialogDescription>
              Please confirm that you've shared your referral link on {selectedAction?.label}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Only confirm if you've actually shared your referral. False confirmations may result in penalties.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmShare}
              disabled={trackSocialShareMutation.isPending}
            >
              {trackSocialShareMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  I've Shared It
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};