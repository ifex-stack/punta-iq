import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReferralHistoryProps {
  referrals: Array<{
    id: number;
    referredId: number;
    status: string;
    createdAt: string | Date;
    completedAt: string | Date | null;
    rewardAmount: number | null;
    rewardDate: string | Date | null;
    username?: string;
  }>;
}

export const ReferralHistory: FC<ReferralHistoryProps> = ({ referrals }) => {
  // Filter referrals by status
  const pendingReferrals = referrals.filter(ref => ref.status === 'pending');
  const completedReferrals = referrals.filter(ref => ref.status === 'completed');
  
  // Format date for better display
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  // Helper to get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Helper to get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'destructive',
      default: 'outline'
    };
    
    const variant = variants[status] || variants.default;
    
    return (
      <Badge variant={variant as any} className="gap-1 py-1 capitalize">
        <StatusIcon status={status} />
        {status}
      </Badge>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Referral History
        </CardTitle>
        <CardDescription>
          Track your referrals and rewards
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({referrals.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingReferrals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedReferrals.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0 space-y-4">
            {referrals.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {referrals.map(referral => (
                  <ReferralItem key={referral.id} referral={referral} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You haven't referred anyone yet. Share your referral code to get started!
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-0 space-y-4">
            {pendingReferrals.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {pendingReferrals.map(referral => (
                  <ReferralItem key={referral.id} referral={referral} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No pending referrals at the moment.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0 space-y-4">
            {completedReferrals.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {completedReferrals.map(referral => (
                  <ReferralItem key={referral.id} referral={referral} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You don't have any completed referrals yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Individual referral item
const ReferralItem = ({ referral }: { referral: ReferralHistoryProps['referrals'][0] }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-medium">
            {referral.username || `User #${referral.referredId}`}
          </h4>
          <p className="text-xs text-muted-foreground">
            Referred on {new Date(referral.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={referral.status} />
        
        {referral.status === 'completed' && referral.rewardAmount && (
          <span className="text-xs text-green-600 font-medium">
            +{referral.rewardAmount} points
          </span>
        )}
        
        {referral.status === 'pending' && (
          <span className="text-xs text-muted-foreground">
            Waiting for sign-up completion
          </span>
        )}
      </div>
    </div>
  );
};