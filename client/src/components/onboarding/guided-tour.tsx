import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/lib/feature-flags";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Tour steps configuration
const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to PuntaIQ",
    description: "Thanks for joining PuntaIQ! Let's take a quick tour of the app's main features to help you get started.",
    position: "right",
    route: "/"
  },
  {
    id: "predictions",
    title: "AI-Powered Predictions",
    description: "Our AI generates predictions daily without human intervention. Browse predictions by sport and filter by confidence level or market type.",
    position: "bottom",
    route: "/"
  },
  {
    id: "accumulators",
    title: "Smart Accumulators",
    description: "Discover our specially curated accumulators with odds of 15, 20, 30, and 50 - a unique feature that sets us apart!",
    position: "left",
    route: "/"
  },
  {
    id: "history",
    title: "Historical Dashboard",
    description: "Track performance over time with our comprehensive analytics. See how predictions have performed and identify trends.",
    position: "bottom",
    route: "/history"
  },
  {
    id: "profile",
    title: "Personalize Your Experience",
    description: "Set up your profile, manage notification preferences, and customize your experience.",
    position: "left",
    route: "/profile"
  },
  {
    id: "subscription",
    title: "Unlock Premium Features",
    description: "Upgrade to a premium subscription for exclusive predictions, advanced statistics, and priority support.",
    position: "bottom",
    route: "/subscription"
  },
  {
    id: "chatbot",
    title: "AI Assistant",
    description: "Have questions? Our AI chatbot is available 24/7 to help with any questions about predictions or features.",
    position: "right", 
    route: "/"
  }
];

// Determine if the user is new or returning
const isNewUser = () => {
  return !localStorage.getItem('puntaiq_onboarded');
};

// Mark user as onboarded
const markAsOnboarded = () => {
  localStorage.setItem('puntaiq_onboarded', 'true');
};

export function GuidedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const showOnboarding = useFeatureFlag('onboarding');
  
  // Show the tour automatically for new users
  useEffect(() => {
    if (showOnboarding && isNewUser()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // Wait 2 seconds after page load
      
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);
  
  // Navigate to the appropriate route when step changes
  useEffect(() => {
    if (isOpen && tourSteps[currentStep]?.route) {
      navigate(tourSteps[currentStep].route);
    }
  }, [currentStep, isOpen, navigate]);
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    setIsOpen(false);
    markAsOnboarded();
    toast({
      title: "Tour Completed",
      description: "You can start the tour again from the Help menu anytime.",
    });
  };
  
  const handleSkip = () => {
    setIsOpen(false);
    markAsOnboarded();
    toast({
      title: "Tour Skipped",
      description: "You can start the tour again from the Help menu anytime.",
    });
  };
  
  // Allow manually opening the tour
  const openTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };
  
  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side={currentTourStep?.position || "right"} className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl">{currentTourStep?.title}</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          <SheetDescription className="text-base mt-4">
            {currentTourStep?.description}
          </SheetDescription>
          <div className="mt-2 text-sm text-muted-foreground">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
          <SheetFooter className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* This component can be manually triggered from anywhere in the app */}
      {!isOpen && showOnboarding && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="secondary"
            onClick={openTour}
            className="shadow-lg"
          >
            Take Tour
          </Button>
        </div>
      )}
    </>
  );
}