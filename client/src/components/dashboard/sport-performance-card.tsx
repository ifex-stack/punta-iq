import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SportPerformance {
  totalPredictions: number;
  successRate: number;
  averageOdds: number;
  roi: number;
  wonCount: number;
  lostCount: number;
}

interface SportPerformanceCardProps {
  sportName: string;
  sportIcon?: React.ReactNode;
  data: SportPerformance;
  loading?: boolean;
}

export const SportPerformanceCard: React.FC<SportPerformanceCardProps> = ({
  sportName,
  sportIcon,
  data,
  loading = false,
}) => {
  // Return specific styles based on performance metrics
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 65) return 'text-green-500';
    if (rate >= 55) return 'text-emerald-400';
    if (rate >= 50) return 'text-amber-400';
    return 'text-red-500';
  };
  
  const getRoiClass = (roi: number) => {
    if (roi >= 15) return 'text-green-500';
    if (roi >= 5) return 'text-emerald-400';
    if (roi >= 0) return 'text-amber-400';
    return 'text-red-500';
  };
  
  // Different loading states
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {sportIcon && 
            <div className="text-muted-foreground">{sportIcon}</div>
          }
          <CardTitle className="text-lg capitalize">{sportName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">Success rate</div>
            <div className={cn("text-2xl font-bold", getSuccessRateColor(data.successRate))}>
              {data.successRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">ROI</div>
              <div className="flex items-center">
                <div className={cn("text-lg font-semibold", getRoiClass(data.roi))}>
                  {data.roi >= 0 ? '+' : ''}{data.roi.toFixed(1)}%
                </div>
                {data.roi >= 0 ? (
                  <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="ml-1 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Avg. Odds</div>
              <div className="text-lg font-semibold">
                {data.averageOdds.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-base font-medium">{data.totalPredictions}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Won</div>
              <div className="text-base font-medium text-green-500">{data.wonCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Lost</div>
              <div className="text-base font-medium text-red-500">{data.lostCount}</div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};