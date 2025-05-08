import React, { useState, useEffect } from 'react';
import { ConfidenceMeter } from "@/components/confidence-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { ConfidenceBreakdown, createDefaultConfidenceBreakdown } from '@/lib/prediction-confidence-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const predictionIds = [1, 2, 3]; // Example prediction IDs

export default function ConfidenceMeterDemo() {
  const [selectedPredictionId, setSelectedPredictionId] = useState<number>(predictionIds[0]);
  const { toast } = useToast();
  
  // Query for confidence data
  const { 
    data: confidenceData, 
    isLoading,
    error
  } = useQuery<ConfidenceBreakdown>({
    queryKey: ['/api/predictions', selectedPredictionId, 'confidence'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/predictions/${selectedPredictionId}/confidence`);
        if (!response.ok) {
          throw new Error('Failed to fetch confidence data');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching confidence data:', error);
        throw error;
      }
    },
    enabled: !!selectedPredictionId,
  });

  // Fetch prediction details
  const { 
    data: prediction, 
    isLoading: predictionLoading
  } = useQuery({
    queryKey: ['/api/predictions', selectedPredictionId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/predictions/${selectedPredictionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prediction data');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching prediction data:', error);
        throw error;
      }
    },
    enabled: !!selectedPredictionId,
  });

  // Generate fallback data if actual data is not available
  const fallbackData: ConfidenceBreakdown = {
    overall: 75,
    base: 70,
    personal: 75,
    factors: [
      {
        name: 'Form',
        value: 82,
        type: 'form',
        description: 'Recent team performance and form evaluation.'
      },
      {
        name: 'Head to Head',
        value: 65,
        type: 'head_to_head',
        description: 'Historical results between the two teams.'
      },
      {
        name: 'Home Advantage',
        value: 70,
        type: 'home_advantage',
        description: 'Statistical advantage for the home team based on historical data.'
      },
      {
        name: 'Market Value',
        value: 77,
        type: 'market_movement',
        description: 'Recent movements in betting markets and implied probabilities.'
      },
      {
        name: 'User Preference',
        value: 85,
        type: 'user_preference',
        description: 'Personalized factor based on your preferences and betting history.'
      }
    ],
    algorithmVersion: '1.0'
  };

  // If error occurs in fetching data
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading confidence data",
        description: "Using demo data instead",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Use real data if available, otherwise fallback
  const confidenceDisplay = confidenceData || fallbackData;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">AI-Powered Confidence Meter</h1>
      <p className="text-lg mb-8">
        This demo showcases our new personalized confidence meter that tailors prediction confidence 
        based on your preferences and betting history.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Prediction Details</CardTitle>
              <CardDescription>
                Select a prediction to view its personalized confidence breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={selectedPredictionId.toString()} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  {predictionIds.map(id => (
                    <TabsTrigger 
                      key={id} 
                      value={id.toString()}
                      onClick={() => setSelectedPredictionId(id)}
                    >
                      Prediction {id}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {predictionLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : prediction ? (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {prediction.homeTeam} vs {prediction.awayTeam}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {prediction.league} - {new Date(prediction.startTime).toLocaleString()}
                    </p>
                    <div className="font-medium mt-4">
                      Prediction: <span className="text-primary">{prediction.predictedOutcome}</span>
                    </div>
                    <div className="mt-2">
                      Odds: <span className="font-medium">{prediction.odds || '1.95'}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Example Match {selectedPredictionId}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Premier League - {new Date().toLocaleDateString()}
                    </p>
                    <div className="font-medium mt-4">
                      Prediction: <span className="text-primary">Home Win</span>
                    </div>
                    <div className="mt-2">
                      Odds: <span className="font-medium">1.95</span>
                    </div>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ConfidenceMeter 
              overall={confidenceDisplay.overall}
              base={confidenceDisplay.base}
              personal={confidenceDisplay.personal}
              factors={confidenceDisplay.factors}
              algorithmVersion={confidenceDisplay.algorithmVersion}
              predictionId={selectedPredictionId}
              showDetails={true}
            />
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <p className="mb-4">
          Our AI-powered confidence meter analyzes multiple factors to determine prediction confidence:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>Base confidence is calculated from match data, team form, and statistical analysis</li>
          <li>Personal confidence adjusts the base rating based on your preferences and betting history</li>
          <li>Individual factors are weighted based on their historical accuracy and relevance</li>
          <li>The algorithm continuously improves as it learns from more data</li>
        </ul>
        <p>
          Premium subscribers get access to more detailed confidence breakdowns and 
          advanced personalization features.
        </p>
      </div>
    </div>
  );
}