import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictionCard } from '@/components/mobile/prediction-card';
import { FilterSection } from '@/components/mobile/filter-section';
import { Trophy, Star, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

// Define the Prediction type
interface Prediction {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  market: string;
  prediction: string;
  odds: number;
  confidence: number;
  startTime: string;
  isCorrect: boolean | null;
  isPremium?: boolean;
}

export default function MobileHomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState<string>('today');
  
  // Format date for API request
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Query for daily predictions
  const { 
    data: todaysPredictions = [], 
    isLoading: isLoadingToday 
  } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions/top-picks', formattedDate],
    enabled: !!user,
  });
  
  // Query for upcoming big events
  const { 
    data: bigEvents = [], 
    isLoading: isLoadingEvents 
  } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions/big-events'],
    enabled: !!user,
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Handle date selection
  const handleSelectDate = (date: 'today' | 'tomorrow' | 'weekend') => {
    const today = new Date();
    
    switch (date) {
      case 'today':
        setSelectedDate(today);
        break;
      case 'tomorrow':
        setSelectedDate(addDays(today, 1));
        break;
      case 'weekend':
        // Find upcoming weekend (Saturday)
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
        setSelectedDate(addDays(today, daysUntilSaturday));
        break;
    }
    
    setSelectedTab(date);
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mb-4 mt-2">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">AI Predictions</h1>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="h-8 flex gap-1 items-center">
              <Calendar size={14} />
              <span className="text-xs">Calendar</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Daily picks powered by our AI algorithm
        </p>
      </section>
      
      {/* Date quick filter */}
      <section className="mb-6">
        <Tabs 
          value={selectedTab} 
          onValueChange={(value) => handleSelectDate(value as 'today' | 'tomorrow' | 'weekend')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
            <TabsTrigger value="weekend">Weekend</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>
      
      {/* Top Picks */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center gap-1">
            <Trophy size={16} className="text-amber-500" />
            Top Picks Today
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Button>
        </div>
        
        {isLoadingToday ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : todaysPredictions.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {todaysPredictions.slice(0, 3).map(prediction => (
              <motion.div key={prediction.id} variants={itemVariants}>
                <PredictionCard
                  homeTeam={prediction.homeTeam}
                  awayTeam={prediction.awayTeam}
                  league={prediction.league}
                  date={prediction.startTime}
                  odds={prediction.odds}
                  prediction={prediction.prediction}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">No predictions available for today</p>
          </div>
        )}
      </section>
      
      {/* Big Events */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center gap-1">
            <Star size={16} className="text-amber-500" />
            Big Events
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Button>
        </div>
        
        {isLoadingEvents ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : bigEvents.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {bigEvents.slice(0, 2).map(prediction => (
              <motion.div key={prediction.id} variants={itemVariants}>
                <PredictionCard
                  homeTeam={prediction.homeTeam}
                  awayTeam={prediction.awayTeam}
                  league={prediction.league}
                  date={prediction.startTime}
                  odds={prediction.odds}
                  prediction={prediction.prediction}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">No big events available</p>
          </div>
        )}
      </section>
      
      {/* Performance Card */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center gap-1">
            <TrendingUp size={16} className="text-green-500" />
            AI Performance
          </h2>
        </div>
        
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-medium">Weekly Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">72%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold">+12%</p>
                <p className="text-xs text-muted-foreground">Return on Investment</p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4" 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/history'}
            >
              View Detailed Performance
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}