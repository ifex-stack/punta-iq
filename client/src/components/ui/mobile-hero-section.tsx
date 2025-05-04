import React from "react";
import { useLocation } from "wouter";
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

interface MobileHeroSectionProps {
  title: string;
  description: string;
  primaryActionLabel?: string;
  primaryActionPath?: string;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
  gradient?: string;
}

export function MobileHeroSection({
  title,
  description,
  primaryActionLabel,
  primaryActionPath,
  secondaryActionLabel,
  secondaryActionPath,
  gradient = "from-blue-600 to-indigo-700",
}: MobileHeroSectionProps) {
  const [_, navigate] = useLocation();

  return (
    <div className={`w-full bg-gradient-to-r ${gradient} rounded-lg p-6 mb-6 text-white`}>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-white/90 mb-4">
        {description}
      </p>
      
      <div className="flex gap-3">
        {primaryActionLabel && primaryActionPath && (
          <Button
            variant="secondary"
            className="bg-white text-blue-600 border-0 hover:bg-white/90"
            onClick={() => navigate(primaryActionPath)}
          >
            {primaryActionLabel}
          </Button>
        )}
        
        {secondaryActionLabel && secondaryActionPath && (
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            onClick={() => navigate(secondaryActionPath)}
          >
            {secondaryActionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}