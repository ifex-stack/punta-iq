import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './onboarding-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

export function GuidedTour() {
  const { 
    isTourVisible, 
    currentTourStep, 
    tourSteps, 
    endTour,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    markTourCompleted,
  } = useOnboarding();
  
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  const spotlightRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Find the target element and update its position
  useEffect(() => {
    if (!isTourVisible || !tourSteps.length) return;
    
    const currentStep = tourSteps[currentTourStep];
    const selector = currentStep?.targetSelector;
    
    if (!selector) return;
    
    // Special case for the body selector (full screen spotlight)
    if (selector === 'body') {
      setTargetElement(document.body);
      setTargetRect(new DOMRect(0, 0, windowSize.width, windowSize.height));
      return;
    }
    
    const element = document.querySelector(selector);
    
    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll to the element if it's not in view
      const isInView = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowSize.height &&
        rect.right <= windowSize.width
      );
      
      if (!isInView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetElement(null);
      setTargetRect(null);
    }
  }, [isTourVisible, currentTourStep, tourSteps, windowSize]);
  
  // Position the tooltip relative to the target
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;
    
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const currentStep = tourSteps[currentTourStep];
    const placement = currentStep?.placement || 'bottom';
    
    let top = 0;
    let left = 0;
    
    // Calculate tooltip position based on placement
    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 16;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 16;
        break;
      case 'bottom':
        top = targetRect.bottom + 16;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 16;
        break;
      case 'center':
        top = (windowSize.height / 2) - (tooltipRect.height / 2);
        left = (windowSize.width / 2) - (tooltipRect.width / 2);
        break;
    }
    
    // Ensure tooltip stays within window bounds
    if (left < 16) left = 16;
    if (left + tooltipRect.width > windowSize.width - 16) {
      left = windowSize.width - tooltipRect.width - 16;
    }
    if (top < 16) top = 16;
    if (top + tooltipRect.height > windowSize.height - 16) {
      top = windowSize.height - tooltipRect.height - 16;
    }
    
    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
  }, [targetRect, tourSteps, currentTourStep, windowSize]);
  
  // Handle escape key to close tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        prevTourStep();
      }
    };
    
    if (isTourVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isTourVisible, endTour, nextTourStep, prevTourStep]);
  
  // Handle tour completion
  const handleComplete = () => {
    endTour();
    markTourCompleted();
  };
  
  // Render nothing if tour is not visible
  if (!isTourVisible || tourSteps.length === 0) {
    return null;
  }
  
  const currentStep = tourSteps[currentTourStep];
  const spotlightRadius = currentStep.spotlightRadius !== undefined 
    ? currentStep.spotlightRadius 
    : (targetRect ? Math.max(targetRect.width, targetRect.height) / 2 + 8 : 0);
  
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Overlay with spotlight */}
      <div 
        className="absolute inset-0 bg-black/70 transition-opacity duration-300 pointer-events-auto"
        onClick={endTour}
      >
        {/* Spotlight */}
        <div
          ref={spotlightRef}
          className="absolute rounded-full transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect ? targetRect.top + (targetRect.height / 2) : 0,
            left: targetRect ? targetRect.left + (targetRect.width / 2) : 0,
            width: spotlightRadius * 2,
            height: spotlightRadius * 2,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
          }}
        />
      </div>
      
      {/* Tooltip */}
      <motion.div 
        ref={tooltipRef}
        className="absolute bg-card border border-border rounded-lg shadow-xl p-5 w-[320px] pointer-events-auto"
        style={{ maxWidth: 'calc(100% - 32px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <button 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          onClick={endTour}
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 transition-all ${
                index === currentTourStep
                  ? 'bg-primary w-6'
                  : 'bg-primary/30 hover:bg-primary/50 w-3'
              } rounded-full`}
              onClick={() => goToTourStep(index)}
            />
          ))}
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
        
        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <div>
            {currentTourStep > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevTourStep}
                className="flex items-center gap-1 p-0 h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div className="w-12" />
            )}
          </div>
          
          <div>
            {currentTourStep < tourSteps.length - 1 ? (
              <Button
                variant="default"
                size="sm"
                onClick={nextTourStep}
                className="flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleComplete}
              >
                Got it
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Help button component that can be placed anywhere to trigger the tour
export function TourHelpButton() {
  const { startTour } = useOnboarding();
  
  return (
    <Button 
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={startTour}
      title="Show Help Tour"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}