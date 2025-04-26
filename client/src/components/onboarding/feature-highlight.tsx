import { useState, useRef, useEffect, ReactNode } from "react";
import { useFeatureFlag } from "@/lib/feature-flags";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, HelpCircle, Info } from "lucide-react";

interface FeatureHighlightProps {
  id: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  dismissible?: boolean;
  className?: string;
}

/**
 * Feature Highlight Component
 * Use this to highlight new features or important information for users
 * Can be dismissed permanently if dismissible=true
 */
export function FeatureHighlight({
  id,
  title,
  description,
  children,
  icon = <Info className="h-5 w-5" />,
  dismissible = true,
  className = "",
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const featureFlagsEnabled = useFeatureFlag('featureHighlights');
  
  useEffect(() => {
    // Check if this highlight was dismissed before
    const wasDismissed = localStorage.getItem(`feature_highlight_${id}_dismissed`) === 'true';
    
    if (wasDismissed) {
      setIsVisible(false);
    } else {
      // Add entrance animation
      setTimeout(() => {
        setHasAnimated(true);
      }, 100);
    }
  }, [id]);
  
  // If feature flags are disabled, don't show highlights
  if (!featureFlagsEnabled) {
    return null;
  }
  
  const handleDismiss = () => {
    if (cardRef.current) {
      cardRef.current.classList.add('opacity-0', 'scale-95');
      
      setTimeout(() => {
        setIsVisible(false);
        
        // Remember that this was dismissed
        if (dismissible) {
          localStorage.setItem(`feature_highlight_${id}_dismissed`, 'true');
        }
      }, 300);
    }
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <Card
      ref={cardRef}
      className={`shadow-lg border border-primary/20 transition-all duration-300 ${
        hasAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-primary">{icon || <HelpCircle className="h-5 w-5" />}</div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          {dismissible && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 text-sm text-muted-foreground">
        {description}
      </CardContent>
      
      {children && (
        <CardFooter className="flex justify-end pt-0 pb-3">
          {children}
        </CardFooter>
      )}
    </Card>
  );
}