import { FC, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ReferralQRCodeProps {
  className?: string;
  referralCode: string;
  shareUrl: string;
}

export const ReferralQRCode: FC<ReferralQRCodeProps> = ({ className, referralCode, shareUrl }) => {
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    // Generate QR code using a service like QRServer.com
    // This creates a QR code with the full tracking URL
    const encodedUrl = encodeURIComponent(shareUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}&color=6E56CF`;
    setQrUrl(qrCodeUrl);
  }, [shareUrl]);
  
  const downloadQRCode = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PuntaIQ-referral-${referralCode}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "QR Code Downloaded",
        description: "Share it with friends to earn rewards!",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        // Convert the QR code to a blob for sharing
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const file = new File([blob], `PuntaIQ-referral-${referralCode}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Join PuntaIQ with my referral code',
          text: `Join PuntaIQ using my referral code: ${referralCode}. Get the best AI-powered sports predictions!`,
          url: shareUrl,
          files: [file]
        });
        
        toast({
          title: "QR Code Shared",
          description: "Thanks for spreading the word!",
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        // Fall back to sharing just the URL if image sharing fails
        try {
          await navigator.share({
            title: 'Join PuntaIQ with my referral code',
            text: `Join PuntaIQ using my referral code: ${referralCode}. Get the best AI-powered sports predictions!`,
            url: shareUrl
          });
        } catch (fallbackError) {
          toast({
            title: "Sharing Failed",
            description: "Please try another sharing method",
            variant: "destructive"
          });
        }
      }
    } else {
      // Fallback for browsers that don't support native sharing
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share it with your friends to earn rewards!",
      });
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Your Referral QR Code
        </CardTitle>
        <CardDescription>
          Scan this code to instantly share your referral
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {qrUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative p-3 rounded-lg border border-primary/20 bg-primary/5"
          >
            <img 
              src={qrUrl} 
              alt={`QR Code for referral ${referralCode}`} 
              width={200} 
              height={200}
              className="rounded-md"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-md">
              <Button variant="outline" size="sm" className="bg-white" onClick={downloadQRCode}>
                <Download className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="w-[200px] h-[200px] rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <QrCode className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="text-center mt-4 space-y-1">
          <p className="text-sm font-medium">Referral Code</p>
          <p className="text-lg font-bold tracking-wider">{referralCode}</p>
          <p className="text-xs text-muted-foreground mt-2">
            When scanning, this QR code will track which users came from your link
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadQRCode}
          disabled={isDownloading || !qrUrl}
        >
          <Download className="h-4 w-4 mr-1" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={shareQRCode}
          disabled={!qrUrl}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};