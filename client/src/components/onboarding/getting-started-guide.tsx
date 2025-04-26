import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Star, 
  Award, 
  TrendingUp, 
  Calendar, 
  Settings,
  Users,
  CreditCard,
  MessageCircle,
  ChevronRight
} from "lucide-react";

import { useOnboarding } from "./onboarding-provider";
import { useFeatureFlag } from "@/lib/feature-flags";

/**
 * Getting Started Guide
 * A comprehensive guide for new users to understand the PuntaIQ platform
 */
export function GettingStartedGuide() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { isOnboarded, startOnboarding } = useOnboarding();
  const showGuide = useFeatureFlag('gettingStartedGuide');
  const [, navigate] = useLocation();
  
  if (!showGuide) {
    return null;
  }
  
  return (
    <>
      {/* Guide trigger button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 shadow-lg"
        >
          <Star className="h-4 w-4" />
          Getting Started
        </Button>
      </div>
      
      {/* Guide dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Welcome to PuntaIQ</DialogTitle>
            <DialogDescription className="text-lg">
              Your guide to AI-powered sports predictions
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Key Features</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="font-semibold text-xl">What is PuntaIQ?</h3>
                <p>
                  PuntaIQ is an AI-powered sports prediction platform that generates daily betting predictions 
                  with zero human intervention. Our sophisticated machine learning algorithms analyze vast amounts 
                  of data to provide reliable predictions across multiple sports.
                </p>
                
                <h3 className="font-semibold text-xl">What sets us apart?</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-medium">100% Autonomous AI:</span> All predictions are generated 
                    without human intervention for maximum consistency and credibility.
                  </li>
                  <li>
                    <span className="font-medium">Multi-tiered Accumulators:</span> Exclusive accumulators with 
                    odds of 15, 20, 30, and 50 - carefully balanced for risk and reward.
                  </li>
                  <li>
                    <span className="font-medium">Comprehensive Analytics:</span> Track historical performance 
                    with detailed insights into prediction accuracy over time.
                  </li>
                  <li>
                    <span className="font-medium">Global Focus:</span> Specialized coverage for UK, worldwide, 
                    and Nigerian markets.
                  </li>
                </ul>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => setActiveTab("features")}
                  className="w-full"
                >
                  Explore Key Features
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Award className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">AI-Powered Predictions</h3>
                        <p className="text-sm text-muted-foreground">
                          Daily predictions across multiple sports and markets, ranging from basic 1X2 
                          to more complex correct score predictions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Smart Accumulators</h3>
                        <p className="text-sm text-muted-foreground">
                          Specially curated accumulator bets with variable odds levels (15, 20, 30, 50) 
                          to match your risk tolerance.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Historical Dashboard</h3>
                        <p className="text-sm text-muted-foreground">
                          Track prediction accuracy over time with detailed analytics on 
                          past performance and trends.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Settings className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Personalization</h3>
                        <p className="text-sm text-muted-foreground">
                          Customize your experience with notification preferences, favorite sports, 
                          and preferred prediction types.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Community Features</h3>
                        <p className="text-sm text-muted-foreground">
                          Follow top performers, share predictions, and engage with a community 
                          of like-minded prediction enthusiasts.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">AI Chatbot</h3>
                        <p className="text-sm text-muted-foreground">
                          Get immediate help with any questions about predictions or features from our 
                          24/7 AI support assistant.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => setActiveTab("faq")}
                  className="w-full"
                >
                  Frequently Asked Questions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="font-semibold text-xl">Frequently Asked Questions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg">How accurate are the predictions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI system maintains an average accuracy rate of 60-75% across different sports, 
                      with performance varying by league and market type. You can view detailed historical 
                      performance data in the Historical Dashboard section.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-lg">Are the predictions made by humans?</h4>
                    <p className="text-sm text-muted-foreground">
                      No, all predictions are generated by our autonomous AI system with zero human intervention. 
                      This ensures consistency, eliminates bias, and maintains the integrity of our prediction process.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-lg">What sports do you cover?</h4>
                    <p className="text-sm text-muted-foreground">
                      We currently cover football (soccer), basketball, tennis, and rugby, with plans to expand 
                      to additional sports in the future. Our prediction coverage is most comprehensive for major 
                      leagues and tournaments.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-lg">Do I need a subscription?</h4>
                    <p className="text-sm text-muted-foreground">
                      We offer both free and premium tiers. Free users can access basic predictions and features, 
                      while premium subscribers get access to exclusive predictions, advanced statistics, priority 
                      support, and special accumulator picks.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-lg">How often are predictions updated?</h4>
                    <p className="text-sm text-muted-foreground">
                      New predictions are generated daily, typically available by 8:00 AM UTC. For major events 
                      and tournaments, we may provide special prediction packages with more detailed analysis.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => setActiveTab("next-steps")}
                  className="w-full"
                >
                  Next Steps
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Next Steps Tab */}
            <TabsContent value="next-steps" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="font-semibold text-xl">Getting Started with PuntaIQ</h3>
                <p>
                  Ready to dive in? Here are some recommended steps to get the most out of your PuntaIQ experience:
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" 
                  onClick={() => {
                    setOpen(false);
                    startOnboarding();
                  }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Take the Interactive Tour</h3>
                        <p className="text-sm text-muted-foreground">
                          Get familiar with the interface and key features through our guided tour.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Set Up Your Profile</h3>
                        <p className="text-sm text-muted-foreground">
                          Customize your preferences and notification settings to get the most relevant updates.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate("/");
                  }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Explore Today's Predictions</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse through our latest AI-generated predictions across different sports and markets.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate("/subscription");
                  }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Consider Premium Features</h3>
                        <p className="text-sm text-muted-foreground">
                          Upgrade to premium to unlock exclusive predictions, detailed analytics, and more.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close Guide
            </Button>
            
            {!isOnboarded && (
              <Button onClick={() => {
                setOpen(false);
                startOnboarding();
              }}>
                Start Interactive Tour
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}