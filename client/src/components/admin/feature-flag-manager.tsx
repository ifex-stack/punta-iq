import { useFeatureFlags } from '@/lib/feature-flags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { InfoIcon, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function FeatureFlagManager() {
  const { flags, setFlag, resetFlag } = useFeatureFlags();
  const { toast } = useToast();

  // Group flags into categories for better organization
  const categories = {
    'Core Features': ['notifications', 'chatbot', 'historicalDashboard'],
    'Premium Features': ['accumulators', 'premiumPredictions'],
    'User Experience': ['onboarding', 'gettingStartedGuide', 'featureHighlights', 'demoNotifications'],
    'Experimental': ['socialSharing', 'userCommunity', 'predictionComments', 'trendingPredictions'],
    'Regional': ['nigeriaSpecificContent', 'ukSpecificContent'],
    'Engagement': ['referralProgram', 'achievementBadges', 'streakRewards']
  };

  // Reset all feature flags to default
  const resetAllFlags = () => {
    try {
      Object.keys(flags).forEach(flag => {
        resetFlag(flag as keyof typeof flags);
      });
      toast({
        title: 'All feature flags reset',
        description: 'All feature flags have been reset to their default values.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset feature flags.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Feature Flag Management</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 flex items-center"
            onClick={resetAllFlags}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset All
          </Button>
        </div>
        <CardDescription>
          Toggle features on and off to test different app configurations.
          Changes affect your local environment only.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <TooltipProvider>
          {Object.entries(categories).map(([category, flagList]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
              <div className="grid gap-4">
                {flagList.map(flagName => {
                  const isEnabled = flags[flagName as keyof typeof flags];
                  const descriptions: Record<string, string> = {
                    notifications: 'Enables push notifications and notification center',
                    chatbot: 'Enables AI assistant chatbot',
                    historicalDashboard: 'Shows historical prediction performance',
                    accumulators: 'Provides accumulator predictions',
                    premiumPredictions: 'Shows premium prediction content',
                    onboarding: 'Enables new user onboarding flow',
                    gettingStartedGuide: 'Shows getting started guide for new users',
                    featureHighlights: 'Highlights new features to users',
                    demoNotifications: 'Shows demo notifications for new users',
                    socialSharing: 'Allows sharing predictions on social media',
                    userCommunity: 'Enables community features and forums',
                    predictionComments: 'Allows commenting on predictions',
                    trendingPredictions: 'Shows trending predictions section',
                    nigeriaSpecificContent: 'Shows Nigeria-specific betting content',
                    ukSpecificContent: 'Shows UK-specific betting content',
                    referralProgram: 'Enables referral program features',
                    achievementBadges: 'Shows achievement badges system',
                    streakRewards: 'Rewards users for prediction streaks'
                  };

                  return (
                    <div
                      key={flagName}
                      className="flex items-center justify-between space-x-2 rounded-md border p-4"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label className="font-medium">{formatFlagName(flagName)}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 ml-2 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80 text-sm">{descriptions[flagName] || 'No description available'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {descriptions[flagName] || 'No description available'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={isEnabled ? 'default' : 'outline'}
                          className={isEnabled 
                            ? 'bg-green-500/20 text-green-700 hover:bg-green-500/20 border-green-500/20' 
                            : 'bg-red-500/10 text-red-700 hover:bg-red-500/10 border-red-500/20'}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => 
                            setFlag(flagName as keyof typeof flags, checked)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

function formatFlagName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1') // Insert a space before all uppercase letters
    .replace(/^./, (str) => str.toUpperCase()) // Uppercase the first character
    .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase words
}