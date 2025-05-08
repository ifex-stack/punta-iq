import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Info, TrendingUp, Shield, Zap, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

export type ConfidenceFactor = {
  name: string;
  value: number; // 0-100
  type: 'form' | 'head_to_head' | 'home_advantage' | 'injuries' | 'motivation' | 
         'weather' | 'fatigue' | 'historical_odds' | 'market_movement' | 
         'model_consensus' | 'expert_opinion' | 'user_preference';
  description: string;
};

export type ConfidenceMeterProps = {
  overall: number; // 0-100
  base: number; // 0-100 (before personalization)
  personal: number; // 0-100 (after personalization)
  factors: ConfidenceFactor[];
  algorithmVersion?: string;
  predictionId?: number;
  className?: string;
  showDetails?: boolean;
};

const getConfidenceColor = (value: number): string => {
  if (value >= 90) return "bg-emerald-500";
  if (value >= 80) return "bg-green-500";
  if (value >= 70) return "bg-lime-500";
  if (value >= 60) return "bg-yellow-500";
  if (value >= 50) return "bg-amber-500";
  if (value >= 40) return "bg-orange-500";
  if (value >= 30) return "bg-red-500";
  return "bg-red-700";
};

const getConfidenceLabel = (value: number): string => {
  if (value >= 90) return "Exceptional";
  if (value >= 80) return "Very High";
  if (value >= 70) return "High";
  if (value >= 60) return "Good";
  if (value >= 50) return "Moderate";
  if (value >= 40) return "Low";
  if (value >= 30) return "Very Low";
  return "Extremely Low";
};

const getFactorIcon = (type: ConfidenceFactor['type']) => {
  switch (type) {
    case 'form': return <TrendingUp className="h-4 w-4" />;
    case 'head_to_head': return <Shield className="h-4 w-4" />; 
    case 'home_advantage': return <Shield className="h-4 w-4" />;
    case 'injuries': return <Shield className="h-4 w-4 text-red-500" />; 
    case 'motivation': return <Zap className="h-4 w-4 text-yellow-500" />;
    case 'weather': return <Clock className="h-4 w-4" />;
    case 'fatigue': return <Clock className="h-4 w-4 text-red-500" />;
    case 'historical_odds': return <BarChart3 className="h-4 w-4" />;
    case 'market_movement': return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'model_consensus': return <BarChart3 className="h-4 w-4 text-blue-500" />;
    case 'expert_opinion': return <Shield className="h-4 w-4 text-purple-500" />;
    case 'user_preference': return <Zap className="h-4 w-4 text-blue-500" />;
    default: return <Info className="h-4 w-4" />;
  }
};

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  overall,
  base,
  personal,
  factors,
  algorithmVersion = "1.0",
  className,
  showDetails = false
}) => {
  const [isOpen, setIsOpen] = useState(showDetails);
  const confidenceColor = getConfidenceColor(overall);
  const confidenceLabel = getConfidenceLabel(overall);
  
  // Sort factors by value (highest first)
  const sortedFactors = [...factors].sort((a, b) => b.value - a.value);
  
  // Calculate personalization impact (positive or negative)
  const personalizationImpact = personal - base;
  
  return (
    <div className={cn("w-full rounded-lg border p-4 shadow-sm", className)}>
      <div className="mb-2 flex justify-between">
        <h3 className="text-lg font-semibold">Confidence Meter</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>AI-powered confidence rating based on multiple factors and personalized to your preferences</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="mt-2 mb-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Overall Confidence</span>
          <span className="text-sm font-bold">{Math.round(overall)}%</span>
        </div>
        <Progress value={overall} className="h-2.5" indicatorClassName={confidenceColor} />
      </div>
      
      <div className="mt-3 mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">{confidenceLabel}</span>
        </div>
        
        <div className="flex items-center">
          {personalizationImpact !== 0 && (
            <div className={cn("text-xs mr-2 px-1.5 py-0.5 rounded", 
              personalizationImpact > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {personalizationImpact > 0 ? "+" : ""}{personalizationImpact.toFixed(1)}%
            </div>
          )}
          <span className="text-xs text-gray-500">v{algorithmVersion}</span>
        </div>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
          <span>Confidence Breakdown</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
        </CollapsibleTrigger>
        
        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-2"
              >
                {base !== overall && (
                  <div className="mb-3 pb-2 border-b border-dashed">
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-gray-600">Base Confidence</span>
                      <span className="font-medium">{Math.round(base)}%</span>
                    </div>
                    <Progress value={base} className="h-1.5" />
                    
                    <div className="flex justify-between mt-2 mb-1 text-xs">
                      <span className="text-gray-600">Personalized</span>
                      <span className="font-medium">{Math.round(personal)}%</span>
                    </div>
                    <Progress value={personal} className="h-1.5" indicatorClassName="bg-blue-500" />
                  </div>
                )}
                
                <div className="space-y-2.5">
                  {sortedFactors.map((factor, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger className="w-full">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <span className="mr-1.5">{getFactorIcon(factor.type)}</span>
                                <span className="text-xs">{factor.name}</span>
                              </div>
                              <span className="text-xs font-medium">{Math.round(factor.value)}%</span>
                            </div>
                            <Progress value={factor.value} className="h-1" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          {factor.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </div>
  );
};