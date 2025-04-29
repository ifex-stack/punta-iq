import { FC, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clipboard, 
  Copy, 
  Share2, 
  Link as LinkIcon, 
  QrCode, 
  Share
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReferralShareProps {
  className?: string;
}

type SocialPlatform = "twitter" | "whatsapp" | "facebook" | "email" | "telegram" | "copy" | "direct";

export const ReferralShare: FC<ReferralShareProps> = ({ className }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get user's referral code
  const { data: referralData, isLoading } = useQuery({
    queryKey: ['/api/user/referral-code'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/referral-code');
      return res.json();
    },
    enabled: !!user
  });
  
  // UTM parameters for better tracking
  const getShareUrl = (platform: SocialPlatform) => {
    const baseUrl = window.location.origin;
    const referralCode = referralData?.referralCode || '';
    const utmParams = new URLSearchParams({
      utm_source: platform,
      utm_medium: 'referral',
      utm_campaign: 'user_share',
      utm_content: user?.username || 'user'
    }).toString();
    
    return `${baseUrl}/register?code=${referralCode}&${utmParams}`;
  };
  
  // Share text templates for different platforms
  const getShareText = (platform: SocialPlatform) => {
    const baseText = "Join me on PuntaIQ and get the best AI-powered sports predictions! Use my referral code for bonus points.";
    
    switch (platform) {
      case "twitter":
        return `${baseText} 🏆 Sign up using this link:`;
      case "facebook":
        return `${baseText} I've been winning with their predictions. Check it out!`;
      case "whatsapp":
        return `${baseText} 📱 Click here to sign up:`;
      case "telegram":
        return `${baseText} 🎮 Use this link to join:`;
      case "email":
        return `${baseText}\n\nI've been using PuntaIQ for my sports predictions and it's been amazing. The AI-powered insights give me an edge when placing bets.\n\nUse my referral link to get started with bonus points:`;
      default:
        return baseText;
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = async (textToCopy?: string) => {
    try {
      const textContent = textToCopy || getShareUrl('copy');
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
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
  
  // Share via platform
  const shareVia = (platform: SocialPlatform) => {
    const shareUrl = getShareUrl(platform);
    const shareText = getShareText(platform);
    
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`);
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
        break;
      case "email":
        window.open(`mailto:?subject=Join me on PuntaIQ&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`);
        break;
      case "direct":
        try {
          navigator.share({
            title: 'Join PuntaIQ',
            text: shareText,
            url: shareUrl
          }).catch(() => {
            // Fallback if Web Share API is not supported
            copyToClipboard(shareUrl);
          });
        } catch {
          copyToClipboard(shareUrl);
        }
        break;
      default:
        copyToClipboard(shareUrl);
    }
  };
  
  // Social platform icons mapped to their brand colors
  const platforms = [
    { 
      id: 'direct', 
      name: 'Share', 
      color: '#6366f1',
      icon: <Share className="h-5 w-5" />
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      color: '#1DA1F2',
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      color: '#25D366',
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      color: '#1877F2',
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg> 
    },
    { 
      id: 'telegram', 
      name: 'Telegram', 
      color: '#0088cc',
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    },
    { 
      id: 'email', 
      name: 'Email', 
      color: '#D44638',
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    },
    { 
      id: 'copy', 
      name: 'Copy Link', 
      color: '#6B7280',
      icon: <Copy className="h-5 w-5" />
    },
  ];
  
  const templates = [
    {
      id: 'default',
      title: 'Default',
      text: 'Join me on PuntaIQ, the AI-powered sports prediction platform! Use my referral code to get bonus points: [LINK]'
    },
    {
      id: 'casual',
      title: 'Casual',
      text: 'Hey! I\'ve been using this awesome prediction app called PuntaIQ. You should check it out: [LINK]'
    },
    {
      id: 'enthusiast',
      title: 'Sports Fan',
      text: 'Looking for better sports predictions? PuntaIQ uses AI to analyze matches and give you the best picks. I\'ve been using it and it\'s fantastic! Sign up with my referral link: [LINK]'
    },
    {
      id: 'formal',
      title: 'Professional',
      text: 'I would like to recommend PuntaIQ, an excellent sports analytics platform that I have found valuable. If you\'re interested, you can register using my referral code: [LINK]'
    },
  ];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Share & Earn
        </CardTitle>
        <CardDescription>
          Share your referral code to earn bonus points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Input 
                    value={getShareUrl('copy')} 
                    readOnly 
                    className="pr-10 font-mono text-sm"
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => copyToClipboard(getShareUrl('copy'))}
                  >
                    {copied ? <Clipboard className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setShowQRCode(true)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>QR Code</DialogTitle>
                      <DialogDescription>
                        Scan this QR code to use your referral link
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-6">
                      <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                        <svg className="w-full h-full text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="10" y="10" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                          <rect x="60" y="10" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                          <rect x="10" y="60" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                          <rect x="60" y="60" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="4" />
                          <rect x="20" y="20" width="10" height="10" fill="currentColor" />
                          <rect x="70" y="20" width="10" height="10" fill="currentColor" />
                          <rect x="20" y="70" width="10" height="10" fill="currentColor" />
                          <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                          <rect x="45" y="15" width="10" height="10" fill="currentColor" />
                          <rect x="45" y="75" width="10" height="10" fill="currentColor" />
                          <rect x="75" y="45" width="10" height="10" fill="currentColor" />
                          <rect x="15" y="45" width="10" height="10" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={() => setShowQRCode(false)}>Close</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with friends to earn rewards when they sign up
              </p>
            </div>
            
            {/* Share via platforms */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Share via</label>
              <div className="grid grid-cols-4 gap-3">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="flex-col h-auto py-3 px-2 gap-1 hover:bg-muted"
                    onClick={() => shareVia(platform.id as SocialPlatform)}
                    style={{ color: platform.color }}
                  >
                    {platform.icon}
                    <span className="text-xs text-muted-foreground mt-1">{platform.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Message Templates */}
            <div className="pt-2">
              <Tabs defaultValue="default">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Message Templates</label>
                  <TabsList className="h-7">
                    {templates.map(template => (
                      <TabsTrigger key={template.id} value={template.id} className="text-xs px-2 py-1">
                        {template.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {templates.map(template => (
                  <TabsContent key={template.id} value={template.id} className="mt-0">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        {template.text.replace('[LINK]', getShareUrl('copy'))}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => copyToClipboard(template.text.replace('[LINK]', getShareUrl('copy')))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Text
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
            
            {/* Performance Tip */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mt-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1">
                <LinkIcon className="h-4 w-4 text-primary" />
                Performance Tip
              </h3>
              <p className="text-xs text-muted-foreground">
                Links containing UTM parameters help us track where your referrals come from, 
                allowing you to see which channels work best. Try sharing across multiple platforms!
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};