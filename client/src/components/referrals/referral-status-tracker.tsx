import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle2, Clock, XCircle, Trophy, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ReferralStatusTrackerProps {
  className?: string;
  referrals: {
    id: number;
    referredUsername: string;
    status: 'pending' | 'completed' | 'rewarded' | 'failed';
    createdAt: string;
    completedAt?: string;
    rewardDate?: string;
    rewardAmount?: number;
  }[];
}

export const ReferralStatusTracker: FC<ReferralStatusTrackerProps> = ({ className, referrals }) => {
  // Group referrals by status for the visual indicator
  const pending = referrals.filter(r => r.status === 'pending').length;
  const completed = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
  const failed = referrals.filter(r => r.status === 'failed').length;
  const total = referrals.length;
  
  // Calculate completion rate for progress bar
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  
  // Sort referrals by date (most recent first)
  const sortedReferrals = [...referrals].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Referral Status Tracker
        </CardTitle>
        <CardDescription>
          Track the status of your referrals in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">Completion Rate</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[250px]">
                      Percentage of referrals that have successfully completed registration and earned rewards.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-bold">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="text-amber-500 font-bold text-lg">{pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-green-500 font-bold text-lg">{completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-bold text-lg">{failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
        
        {/* Referral list with status */}
        <div className="space-y-3 max-h-[350px] overflow-auto pr-1">
          {sortedReferrals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No referrals yet. Start sharing your code!</p>
            </div>
          ) : (
            sortedReferrals.map((referral) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={referral.status} />
                  <div>
                    <p className="text-sm font-medium">{referral.referredUsername}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(referral.createdAt)}
                      {referral.status === 'completed' || referral.status === 'rewarded' ? (
                        <>
                          <ArrowRight className="inline mx-1 h-3 w-3" />
                          {formatDate(referral.completedAt || '')}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {referral.status === 'rewarded' && referral.rewardAmount && (
                    <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-500">
                      <Trophy className="h-3 w-3 mr-0.5" />
                      {referral.rewardAmount} pts
                    </div>
                  )}
                  <StatusBadge status={referral.status} />
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Status legend */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Status Legend:</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3 w-3 text-primary" />
              <span className="text-xs">Rewarded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-xs">Failed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper components
const StatusIcon: FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'rewarded':
      return <Trophy className="h-5 w-5 text-primary" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    rewarded: "bg-primary/10 text-primary border-primary/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  
  const texts: Record<string, string> = {
    pending: "Pending",
    completed: "Completed",
    rewarded: "Rewarded",
    failed: "Failed",
  };
  
  return (
    <Badge variant="outline" className={cn(
      "rounded-full font-normal text-xs",
      variants[status]
    )}>
      {texts[status] || "Unknown"}
    </Badge>
  );
};

// Helpers
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}