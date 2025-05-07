import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart, Brain, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceFactorProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

interface AIConfidenceVisualizerProps {
  overallConfidence: number;
  factors: ConfidenceFactorProps[];
  className?: string;
}

const ConfidenceFactor: React.FC<ConfidenceFactorProps> = ({ label, value, icon, description }) => {
  // Get color based on value
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-emerald-500';
    if (value >= 40) return 'bg-amber-500';
    if (value >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col space-y-1 w-full">
            <div className="flex justify-between text-xs font-medium">
              <div className="flex items-center gap-1">
                {icon}
                <span>{label}</span>
              </div>
              <span>{value}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${getColor(value)}`}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const AIConfidenceVisualizer: React.FC<AIConfidenceVisualizerProps> = ({ 
  overallConfidence, 
  factors,
  className
}) => {
  // Calculate an insight message based on the factors
  const getInsightMessage = () => {
    const highestFactor = [...factors].sort((a, b) => b.value - a.value)[0];
    const lowestFactor = [...factors].sort((a, b) => a.value - b.value)[0];
    
    if (overallConfidence >= 80) {
      return `Strong confidence driven by ${highestFactor.label.toLowerCase()}.`;
    } else if (overallConfidence >= 60) {
      return `Good confidence, with strong ${highestFactor.label.toLowerCase()}.`;
    } else if (overallConfidence >= 40) {
      return `Moderate confidence, consider the low ${lowestFactor.label.toLowerCase()}.`;
    } else {
      return `Low confidence, high risk selection.`;
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-emerald-500';
    if (confidence >= 40) return 'text-amber-500';
    if (confidence >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={cn("p-4 rounded-lg border bg-background/50", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" />
          AI Confidence Analysis
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">Overall:</span>
          <span className={`text-sm font-bold ${getConfidenceColor(overallConfidence)}`}>
            {overallConfidence}%
          </span>
        </div>
      </div>
      
      <div className="space-y-3 mb-3">
        {factors.map((factor, index) => (
          <ConfidenceFactor
            key={index}
            label={factor.label}
            value={factor.value}
            icon={factor.icon}
            description={factor.description}
          />
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground mt-3 flex items-start">
        <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0 mt-0.5" />
        <p>{getInsightMessage()}</p>
      </div>
    </div>
  );
};

export default AIConfidenceVisualizer;