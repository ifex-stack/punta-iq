import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './onboarding-provider';
import { TourHelpButton } from './guided-tour';
import {
  BrainCircuit,
  Trophy,
  LineChart,
  DollarSign,
  BadgePlus,
  BarChart4,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function GettingStartedGuide() {
  const { 
    isGuideVisible, 
    closeGuide, 
    markGuideCompleted, 
    startTour 
  } = useOnboarding();
  
  const [currentTab, setCurrentTab] = useState('features');
  
  // Handle close with completion
  const handleClose = () => {
    closeGuide();
    markGuideCompleted();
  };
  
  // Handle starting the tour
  const handleStartTour = () => {
    closeGuide();
    startTour();
  };
  
  return (
    <AnimatePresence>
      {isGuideVisible && (
        <Dialog open={isGuideVisible} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] max-h-[90vh] p-0 gap-0 bg-card/95 backdrop-blur-sm border-primary/10 rounded-xl overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl">Welcome to PuntaIQ</DialogTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="pt-2">
                Your AI-powered sports prediction platform that helps you make smarter betting decisions
              </DialogDescription>
            </DialogHeader>
            
            <Tabs
              defaultValue="features"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <div className="px-6">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="features">Key Features</TabsTrigger>
                  <TabsTrigger value="howto">How It Works</TabsTrigger>
                  <TabsTrigger value="tips">Betting Tips</TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="h-[400px] overflow-auto p-6 pt-2">
                <TabsContent value="features" className="mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard
                      icon={<BrainCircuit className="h-5 w-5 text-indigo-500" />}
                      title="AI Predictions"
                      description="Our expert prediction system generates high-confidence tips across football, basketball, and other sports."
                    />
                    <FeatureCard
                      icon={<Trophy className="h-5 w-5 text-yellow-500" />}
                      title="Multi-Tier Accumulators"
                      description="Get curated accumulator options ranging from 15x to 50x potential returns based on AI confidence levels."
                    />
                    <FeatureCard
                      icon={<LineChart className="h-5 w-5 text-green-500" />}
                      title="Historical Dashboard"
                      description="Track our prediction accuracy over time with detailed statistics across different sports and markets."
                    />
                    <FeatureCard
                      icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
                      title="Subscription Tiers"
                      description="Access premium predictions and advanced features with our flexible subscription plans."
                    />
                    <FeatureCard
                      icon={<BadgePlus className="h-5 w-5 text-blue-500" />}
                      title="Coverage & Markets"
                      description="We cover multiple leagues, tournaments, and betting markets with customizable filters."
                    />
                    <FeatureCard
                      icon={<BarChart4 className="h-5 w-5 text-rose-500" />}
                      title="Performance Analytics"
                      description="Understand the logic behind predictions with detailed confidence ratings and historical trends."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="howto" className="mt-0 space-y-4">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">How Our AI Works</h3>
                      <p className="text-sm text-muted-foreground">
                        PuntaIQ uses sophisticated prediction technology to analyze vast amounts of sports data and generate tips with high confidence levels. Here's how it works:
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StepCard
                        number={1}
                        title="Data Collection"
                        description="Our system continuously collects data from multiple sources including team stats, player performance, historical matches, and other relevant factors."
                      />
                      <StepCard
                        number={2}
                        title="AI Processing"
                        description="Our expert system analyzes patterns and trends in the data to identify high-probability outcomes for upcoming matches."
                      />
                      <StepCard
                        number={3}
                        title="Prediction Generation"
                        description="Our system generates predictions across various markets with confidence ratings to help you make informed betting decisions."
                      />
                      <StepCard
                        number={4}
                        title="Accumulator Creation"
                        description="High-confidence predictions are combined into accumulators with potential returns ranging from 15x to 50x."
                      />
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Autonomous System</h4>
                      <p className="text-sm text-muted-foreground">
                        Our prediction system is fully automated with no human intervention. This eliminates bias and ensures consistent, data-driven predictions based on actual statistics rather than opinions.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tips" className="mt-0 space-y-4">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Smart Betting Tips</h3>
                      <p className="text-sm text-muted-foreground">
                        Follow these guidelines to maximize your success when using PuntaIQ predictions:
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <TipCard
                        title="Focus on High Confidence Predictions"
                        description="Pay special attention to predictions with confidence ratings of 80% and above for the best results."
                      />
                      <TipCard
                        title="Diversify Your Approach"
                        description="Don't put all your stakes on accumulators. Mix single bets with selective accumulators for a balanced strategy."
                      />
                      <TipCard
                        title="Watch Historical Performance"
                        description="Check which sports and markets have the highest historical success rates in our analytics dashboard."
                      />
                      <TipCard
                        title="Use Responsible Bankroll Management"
                        description="Never stake more than 1-3% of your total bankroll on a single bet, regardless of confidence level."
                      />
                      <TipCard
                        title="Be Selective"
                        description="It's better to place fewer, more confident bets than many uncertain ones. Quality over quantity."
                      />
                    </div>
                    
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-warning">Important Reminder</h4>
                      <p className="text-sm text-muted-foreground">
                        While our prediction system aims for high accuracy, no system is perfect. Always bet responsibly and within your means. Sports predictions carry inherent uncertainty.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <DialogFooter className="p-6 pt-3 border-t border-border flex flex-col sm:flex-row gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Need more guidance?</span>
              </div>
              
              <div className="flex flex-1 justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleStartTour}
                  className="gap-1"
                >
                  Take a tour
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={handleClose}>
                  Get Started
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden hover:shadow-md transition-shadow hover:scale-[1.01] card-animation">
      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
        <div className="rounded-full bg-background p-1.5">{icon}</div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Step card component
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
          {number}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Tip card component
function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-lg p-4">
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}