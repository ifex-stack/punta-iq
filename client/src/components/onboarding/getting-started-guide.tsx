import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { useOnboarding } from './onboarding-provider';
import { Trophy, Newspaper, Calendar, ArrowRight, ArrowLeft, X } from 'lucide-react';

const GUIDE_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PuntaIQ',
    description: 'Your smart companion for sports predictions. Let\'s get you started with the basics.',
    icon: Trophy,
  },
  {
    id: 'predictions',
    title: 'Daily Predictions',
    description: 'Check our platform daily for new AI-generated predictions. We offer various prediction types across multiple sports.',
    icon: Newspaper,
  },
  {
    id: 'accumulators',
    title: 'Multi-Tiered Accumulators',
    description: 'Our system creates special accumulators with odds of 15, 20, 30, and 50 to maximize your potential returns.',
    icon: Calendar,
  },
];

export function GettingStartedGuide() {
  const { state, hideGettingStarted, markStepComplete } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = GUIDE_STEPS[currentStepIndex];
  
  // Handle closing the guide
  const handleClose = () => {
    hideGettingStarted();
    markStepComplete('getting_started_completed');
  };
  
  // Go to next step
  const handleNext = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      markStepComplete(currentStep.id);
    } else {
      handleClose();
    }
  };
  
  // Go to previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  // Create the icon component for the current step
  const IconComponent = currentStep?.icon;
  
  return (
    <Sheet open={state.showGettingStartedGuide} onOpenChange={hideGettingStarted}>
      <SheetContent side="bottom" className="h-[450px] sm:h-[450px] rounded-t-xl bg-gradient-to-b from-background via-background to-background/95 border-t-primary/10 px-6">
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-full flex flex-col pt-8">
          <SheetHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
              {IconComponent && (
                <IconComponent className="h-8 w-8 text-primary animate-pulse" />
              )}
            </div>
            
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              {currentStep.title}
            </SheetTitle>
            
            <div className="flex justify-center gap-1 mt-4 mb-2">
              {GUIDE_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStepIndex
                      ? 'w-8 bg-primary'
                      : index < currentStepIndex
                      ? 'w-1.5 bg-primary/60'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <SheetDescription className="text-base mt-4">
              {currentStep.description}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="h-[150px] relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                {/* Step-specific visual content would go here */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {currentStep.id === 'welcome' && (
                    <div className="text-center">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-pulse">
                        PuntaIQ
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        AI-powered sports predictions
                      </p>
                    </div>
                  )}
                  
                  {currentStep.id === 'predictions' && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                      <div className="rounded-md bg-card p-2 animate-float border border-border">
                        <div className="text-xs font-medium mb-1">Football</div>
                        <div className="h-2 bg-primary/20 rounded w-3/4"></div>
                        <div className="h-2 bg-primary/20 rounded w-1/2 mt-1"></div>
                      </div>
                      <div className="rounded-md bg-card p-2 animate-float-delayed border border-border">
                        <div className="text-xs font-medium mb-1">Basketball</div>
                        <div className="h-2 bg-primary/20 rounded w-1/2"></div>
                        <div className="h-2 bg-primary/20 rounded w-3/4 mt-1"></div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep.id === 'accumulators' && (
                    <div className="flex flex-col items-center w-full max-w-xs">
                      <div className="grid grid-cols-4 gap-1 w-full">
                        <div className="rounded-md bg-green-500/20 p-1 text-center text-xs font-medium animate-float">15x</div>
                        <div className="rounded-md bg-blue-500/20 p-1 text-center text-xs font-medium animate-float-delayed">20x</div>
                        <div className="rounded-md bg-purple-500/20 p-1 text-center text-xs font-medium animate-float">30x</div>
                        <div className="rounded-md bg-pink-500/20 p-1 text-center text-xs font-medium animate-float-delayed">50x</div>
                      </div>
                      <div className="mt-2 text-xs text-center text-muted-foreground">
                        Multiple tiers of accumulators for higher returns
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <SheetFooter className="flex justify-between pb-6 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="w-20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext} 
              size="sm"
              className="w-20 group"
            >
              {currentStepIndex === GUIDE_STEPS.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}