import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOnboarding } from './onboarding-provider';
import { PersonalizedOnboarding } from './personalized-onboarding';

export function PersonalizedOnboardingDialog() {
  const { 
    isPersonalizedOnboardingVisible, 
    closePersonalizedOnboarding 
  } = useOnboarding();

  return (
    <Dialog open={isPersonalizedOnboardingVisible} onOpenChange={(open) => {
      if (!open) closePersonalizedOnboarding();
    }}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-0 bg-gradient-to-br from-background to-secondary/10">
        <PersonalizedOnboarding />
      </DialogContent>
    </Dialog>
  );
}