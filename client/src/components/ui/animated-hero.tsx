import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Trophy, Zap, BarChart3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PredictionItem {
  id: string;
  match: string;
  prediction: string;
  confidence: number;
  time: string;
  matchTime: string;
  odds: number;
}

interface HeroProps {
  onGetStarted: () => void;
}

// Sample data for the animated predictions
const DEMO_PREDICTIONS: PredictionItem[] = [
  {
    id: 'pred1',
    match: 'Arsenal vs Liverpool',
    prediction: 'Over 2.5 Goals',
    confidence: 87,
    time: '2h ago',
    matchTime: 'Today, 20:45',
    odds: 1.85,
  },
  {
    id: 'pred2',
    match: 'Bayern Munich vs Dortmund',
    prediction: 'Bayern Win',
    confidence: 92,
    time: '1h ago',
    matchTime: 'Today, 19:30',
    odds: 1.45, 
  },
  {
    id: 'pred3',
    match: 'Barcelona vs Real Madrid',
    prediction: 'Both Teams to Score',
    confidence: 89,
    time: '3h ago',
    matchTime: 'Today, 21:00',
    odds: 1.72,
  },
  {
    id: 'pred4',
    match: 'Man City vs Chelsea',
    prediction: 'Man City -1',
    confidence: 84,
    time: '4h ago',
    matchTime: 'Tomorrow, 15:00',
    odds: 2.05,
  },
];

// Stats cards data
const STATS_CARDS = [
  { 
    title: '86%', 
    description: 'Prediction Accuracy', 
    icon: <Trophy className="w-5 h-5 text-yellow-500" />,
    color: 'from-yellow-500/20 to-amber-500/5',
  },
  { 
    title: '15x-50x', 
    description: 'Accu Options', 
    icon: <Zap className="w-5 h-5 text-blue-500" />,
    color: 'from-blue-500/20 to-indigo-500/5',
  },
  { 
    title: '3,500+', 
    description: 'Weekly Predictions', 
    icon: <BarChart3 className="w-5 h-5 text-green-500" />,
    color: 'from-green-500/20 to-emerald-500/5',
  },
];

export function AnimatedHero({ onGetStarted }: HeroProps) {
  const [activePredictionIndex, setActivePredictionIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Automatically cycle through predictions
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePredictionIndex((prev) => 
        prev === DEMO_PREDICTIONS.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background/95 to-primary/5 backdrop-blur-sm border border-primary/10 shadow-xl">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Animated gradient orbs in background */}
        <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-primary/10 to-transparent blur-3xl animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-gradient-to-r from-accent/10 to-transparent blur-3xl animate-float-delayed" />
        <div className="absolute top-[60%] left-[50%] w-[200px] h-[200px] rounded-full bg-gradient-to-r from-secondary/10 to-transparent blur-3xl animate-float" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxYTFhMWEiIGZpbGwtb3BhY2l0eT0iMC4wNSIgZD0iTTM2IDM0aDR2MWgtNHYtMXptMC05aDR2MWgtNHYtMXptMC05aDR2MWgtNHYtMXptMC05aDR2MWgtNHYtMXptLTkgMjdoNHYxaC00di0xem0wLTloNHYxaC00di0xem0wLTloNHYxaC00di0xem0wLTloNHYxaC00di0xem0tOSAyN2g0djFoLTR2LTF6bTAtOWg0djFoLTR2LTF6bTAtOWg0djFoLTR2LTF6bTAtOWg0djFoLTR2LTF6Ii8+PC9nPjwvc3ZnPg==')]" />
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 py-10 px-6 md:px-10 relative z-10">
        {/* Left column - Content */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <Badge 
              className="px-3 py-1 text-sm bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 backdrop-blur-md border-primary/10 text-primary-foreground"
              variant="outline"
            >
              <Star className="w-3.5 h-3.5 mr-1 text-yellow-500" />
              AI-Powered Sports Predictions
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter">
              <span className="block">Smarter Betting with</span>
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-move">
                Predictive AI
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              Our advanced machine learning algorithms generate high-confidence predictions across multiple sports, helping you make informed betting decisions.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              size="lg" 
              className="group text-base rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all duration-300"
              onClick={onGetStarted}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base rounded-xl border-primary/20 hover:bg-primary/5 shadow-sm hover:shadow-md transition-all duration-300"
            >
              View Predictions
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-4">
            {STATS_CARDS.map((card, index) => (
              <Card 
                key={index} 
                className={`flex items-center gap-3 p-3 border-primary/10 bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-xl card-3d`}
              >
                <div className="rounded-lg bg-background/80 p-2 backdrop-blur-sm shadow-sm">
                  {card.icon}
                </div>
                <div>
                  <p className="text-lg font-bold">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Right column - Animated predictions */}
        <div 
          ref={containerRef} 
          className="flex items-center justify-center relative overflow-hidden h-[400px] md:h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 z-10" />
          
          <div className="relative z-0 w-full max-w-md mx-auto perspective-1000">
            <AnimatePresence mode="wait">
              {DEMO_PREDICTIONS.map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  className={`absolute inset-0 ${index === activePredictionIndex ? 'z-20' : 'z-10'}`}
                  initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
                  animate={
                    index === activePredictionIndex 
                      ? { opacity: 1, rotateY: 0, scale: 1, z: 50 } 
                      : { opacity: 0, rotateY: -90, scale: 0.9, z: 0 }
                  }
                  exit={{ opacity: 0, rotateY: 90, scale: 0.9, z: 0 }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                >
                  <div className="bg-card/60 backdrop-blur-md border border-primary/10 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all glass">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {prediction.time}
                      </Badge>
                      <Badge className={`${prediction.confidence > 85 ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {prediction.confidence}% Confidence
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{prediction.match}</h3>
                    
                    <div className="bg-background/50 rounded-xl p-3 mb-3 border border-border/50">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Prediction:</span>
                        <span className="font-semibold">{prediction.prediction}</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-muted-foreground text-sm">Odds:</span>
                        <span className="font-semibold text-accent">{prediction.odds.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {prediction.matchTime}
                      </div>
                      <Button size="sm" variant="ghost" className="group text-primary">
                        Details
                        <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Prediction card indicators */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-30">
              {DEMO_PREDICTIONS.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activePredictionIndex
                      ? 'bg-primary w-6'
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                  onClick={() => setActivePredictionIndex(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}