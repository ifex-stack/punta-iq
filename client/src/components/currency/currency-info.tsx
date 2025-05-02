import React from "react";
import { useCurrency } from "@/hooks/use-currency";
import { Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export function CurrencyUpdateInfo({ className = "" }: { className?: string }) {
  const { lastUpdated, refreshRates, currency } = useCurrency();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Format the last updated date
  const formattedDate = React.useMemo(() => {
    if (!lastUpdated) return "Never updated";
    
    // Use relative time if it's less than 24 hours
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise use the date
    return lastUpdated.toLocaleDateString();
  }, [lastUpdated]);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshRates();
      if (success) {
        toast({
          title: "Exchange rates updated",
          description: `Latest rates for ${currency.code} have been applied.`,
        });
      } else {
        toast({
          title: "Couldn't update rates",
          description: "Using current exchange rates. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error refreshing rates:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>Rates updated: {formattedDate}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2 p-1">
              <p>Currency: {currency.name} ({currency.code})</p>
              <p>Exchange rate: {currency.rate} {currency.code} to 1 USD</p>
              <p>Last updated: {lastUpdated?.toLocaleString() || "Never"}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        disabled={isRefreshing}
        onClick={handleRefresh}
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}

// Currency badge that shows the current selected currency with its flag
export function CurrencyBadge({ onClick }: { onClick?: () => void }) {
  const { currency } = useCurrency();
  
  return (
    <Badge 
      variant="outline" 
      className="cursor-pointer px-2 py-0.5 text-xs font-normal"
      onClick={onClick}
    >
      <span className="mr-1">{currency.flag}</span>
      {currency.code}
    </Badge>
  );
}