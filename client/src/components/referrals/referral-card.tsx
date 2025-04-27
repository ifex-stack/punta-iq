import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Share2, Copy, Gift, Users, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureFlag } from "@/lib/feature-flags";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function ReferralCard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isReferralEnabled = useFeatureFlag('referralProgram');
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Get user's referral code
  const { data: referralData, isLoading: isLoadingCode } = useQuery({
    queryKey: ['/api/user/referral-code'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/referral-code');
      return res.json();
    },
    enabled: !!user && isReferralEnabled
  });
  
  // Get user's referral stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/referrals/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals/stats');
      return res.json();
    },
    enabled: !!user && isReferralEnabled
  });
  
  // Get user's referrals
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['/api/referrals'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/referrals');
      return res.json();
    },
    enabled: !!user && isReferralEnabled
  });
  
  // Apply referral code mutation
  const applyReferralMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/referrals/validate', { referralCode: inputReferralCode });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Referral applied!",
        description: "The referral code has been successfully applied.",
      });
      setInputReferralCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error applying referral",
        description: error.message || "Failed to apply referral code. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Copy referral code to clipboard
  const copyToClipboard = async () => {
    if (!referralData?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Share referral code
  const shareReferral = async () => {
    if (!referralData?.referralCode) return;
    
    try {
      await navigator.share({
        title: 'Join PuntaIQ',
        text: `Use my referral code ${referralData.referralCode} to sign up for PuntaIQ and unlock bonus points!`,
        url: window.location.origin
      });
    } catch (err) {
      // If Web Share API is not supported
      copyToClipboard();
    }
  };
  
  // Handle apply referral
  const handleApplyReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputReferralCode) {
      toast({
        title: "Missing Code",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }
    
    applyReferralMutation.mutate();
  };
  
  if (!isReferralEnabled) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends and get rewarded with bonus points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* User's referral code */}
        <div className="space-y-2">
          <Label>Your Referral Code</Label>
          <div className="flex gap-2">
            <Input 
              value={referralData?.referralCode || ''} 
              readOnly 
              disabled={isLoadingCode}
              className="font-mono"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              disabled={isLoadingCode || !referralData?.referralCode}
            >
              {copied ? <Clipboard className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={shareReferral}
              disabled={isLoadingCode || !referralData?.referralCode}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Apply referral code */}
        <form onSubmit={handleApplyReferral} className="space-y-2">
          <Label htmlFor="apply-code">Apply a Referral Code</Label>
          <div className="flex gap-2">
            <Input
              id="apply-code"
              placeholder="Enter referral code"
              value={inputReferralCode}
              onChange={(e) => setInputReferralCode(e.target.value)}
              disabled={applyReferralMutation.isPending}
              className="font-mono"
            />
            <Button
              type="submit"
              disabled={applyReferralMutation.isPending || !inputReferralCode}
            >
              {applyReferralMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : 'Apply'}
            </Button>
          </div>
        </form>
        
        {/* Stats */}
        {isLoadingStats ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : statsData && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{statsData.totalReferrals}</div>
              <div className="text-xs text-muted-foreground">Total Invites</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{statsData.completedReferrals}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{statsData.pendingReferrals}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{statsData.totalRewards}</div>
              <div className="text-xs text-muted-foreground">Points Earned</div>
            </div>
          </div>
        )}
        
        {/* Referral List */}
        {isLoadingReferrals ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : referrals && referrals.length > 0 ? (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Your Referrals
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {referrals.map((referral: any) => (
                <div key={referral.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">User #{referral.referredId}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={referral.status === 'completed' ? 'success' : 'outline'}>
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-0">
        <p className="text-xs text-muted-foreground">
          Earn 500 points for each friend who joins using your referral code and completes their profile.
        </p>
      </CardFooter>
    </Card>
  );
}