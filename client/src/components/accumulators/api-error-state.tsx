import React from 'react';
import { AlertCircle, RefreshCw, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueryObserverResult } from '@tanstack/react-query';

interface ApiErrorStateProps {
  message?: string;
  onRetry: () => Promise<QueryObserverResult<any, Error>>;
  onCreateCustom: () => void;
}

export default function ApiErrorState({ 
  message = "We're experiencing an issue with retrieving data from the sports API. This could be due to API quota limits or temporary service disruption.",
  onRetry,
  onCreateCustom
}: ApiErrorStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">Unable to Load Accumulators</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button 
          onClick={onCreateCustom}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Custom Accumulator
        </Button>
        
        <Button variant="outline" onClick={() => onRetry()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading Accumulators
        </Button>
      </div>
    </div>
  );
}