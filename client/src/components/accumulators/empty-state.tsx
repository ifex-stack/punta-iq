import React from 'react';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  message?: string;
  date?: string;
  onCreateCustom: () => void;
}

export default function EmptyState({ 
  message = "We don't have any accumulator predictions matching your criteria.",
  date,
  onCreateCustom
}: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Accumulators Available</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
        {date && ` for ${date}.`}
        {!date && '.'}
        <br />
        Try changing the date, risk level, or sport filter.
      </p>
      
      <Button onClick={onCreateCustom}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Custom Accumulator
      </Button>
    </div>
  );
}