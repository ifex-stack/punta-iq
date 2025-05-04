import { AIServiceStatus } from '@/components/ai-service-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Info, Server, Settings, Terminal } from 'lucide-react';

export default function AIServiceStatusPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Service Status & Management</h1>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Service Status</span>
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span>API Documentation</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Service Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-6">
            <AIServiceStatus />
          </TabsContent>
          
          <TabsContent value="apis" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    AI Prediction API
                  </CardTitle>
                  <CardDescription>
                    Main prediction engine powering the tiered prediction system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The AI Prediction API provides advanced machine learning-powered predictions
                    for various sports with tiered confidence levels and value bet analysis.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Core Endpoints:</h3>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-sm">
                          GET /api/predictions/sports/:sport - Get predictions for a specific sport
                        </li>
                        <li className="text-sm">
                          GET /api/predictions/accumulators - Get accumulator predictions
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Features:</h3>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-sm">Tier-based predictions (Tier 1, 2, 5, 10)</li>
                        <li className="text-sm">Value bet identification and edge calculation</li>
                        <li className="text-sm">Confidence scoring with explanations</li>
                        <li className="text-sm">Smart accumulator generation across sports</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    External Data Services
                  </CardTitle>
                  <CardDescription>
                    Real-time sports data providers powering the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold">The Odds API</h3>
                      <p className="text-sm text-muted-foreground my-2">
                        Provides real-time odds data from multiple bookmakers globally.
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-sm">GET /api/odds/:sport - Get odds for a specific sport</li>
                        <li className="text-sm">GET /api/sports - Get list of available sports</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">TheSportsDB API</h3>
                      <p className="text-sm text-muted-foreground my-2">
                        Provides comprehensive sports data including leagues, teams, and live scores.
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-sm">GET /api/livescore - Get live scores</li>
                        <li className="text-sm">GET /api/fixtures/league/:id - Get fixtures for a league</li>
                        <li className="text-sm">GET /api/teams/league/:id - Get teams in a league</li>
                        <li className="text-sm">GET /api/leagues - Get all available leagues</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Service Configuration</CardTitle>
                <CardDescription>
                  Configure how the AI service operates (Admin only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Service configuration options will be available in a future update.
                  Currently, the service uses default configuration settings.
                </p>
                
                <div className="mt-4 rounded-md bg-secondary p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4" />
                    <p>Administrative access required for service configuration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}