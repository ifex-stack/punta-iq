import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from './onboarding-provider';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BrainCircuit,
  Zap,
  Trophy,
  LineChart,
  DollarSign,
  Dribbble,
  Activity,
  Dumbbell,
  Rat,
  FlaskConical,
  Bike,
  Crown,
  X,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// Sports list for selection
const SPORTS_OPTIONS = [
  { id: 'football', name: 'Football', icon: Dribbble },
  { id: 'basketball', name: 'Basketball', icon: Activity },
  { id: 'tennis', name: 'Tennis', icon: Dumbbell },
  { id: 'baseball', name: 'Baseball', icon: Rat },
  { id: 'hockey', name: 'Hockey', icon: FlaskConical },
  { id: 'cricket', name: 'Cricket', icon: Bike },
];

// Betting frequency options
const BETTING_FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'rarely', label: 'Rarely' },
];

// Experience level options
const EXPERIENCE_LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
];

// Risk tolerance options
const RISK_TOLERANCE_OPTIONS = [
  { id: 'low', label: 'Low (safer bets, lower odds)' },
  { id: 'medium', label: 'Medium (balanced approach)' },
  { id: 'high', label: 'High (riskier bets, higher odds)' },
];

// Prediction type options
const PREDICTION_TYPE_OPTIONS = [
  { id: 'singles', label: 'Singles' },
  { id: 'accumulators', label: 'Accumulators' },
  { id: 'both', label: 'Both' },
];

// Odds format options
const ODDS_FORMAT_OPTIONS = [
  { id: 'decimal', label: 'Decimal (1.75)' },
  { id: 'fractional', label: 'Fractional (3/4)' },
  { id: 'american', label: 'American (+135)' },
];

// Define popular leagues by sport for selection
const LEAGUES_BY_SPORT = {
  football: [
    { id: 'premier-league', name: 'Premier League' },
    { id: 'la-liga', name: 'La Liga' },
    { id: 'bundesliga', name: 'Bundesliga' },
    { id: 'serie-a', name: 'Serie A' },
    { id: 'ligue-1', name: 'Ligue 1' },
    { id: 'champions-league', name: 'Champions League' },
  ],
  basketball: [
    { id: 'nba', name: 'NBA' },
    { id: 'euroleague', name: 'EuroLeague' },
    { id: 'ncaa', name: 'NCAA' },
  ],
  tennis: [
    { id: 'atp', name: 'ATP Tour' },
    { id: 'wta', name: 'WTA Tour' },
    { id: 'grand-slams', name: 'Grand Slams' },
  ],
  baseball: [
    { id: 'mlb', name: 'MLB' },
    { id: 'npb', name: 'NPB (Japan)' },
  ],
  hockey: [
    { id: 'nhl', name: 'NHL' },
    { id: 'khl', name: 'KHL' },
  ],
  cricket: [
    { id: 'ipl', name: 'IPL' },
    { id: 'big-bash', name: 'Big Bash' },
    { id: 'international', name: 'International' },
  ],
};

// Define our onboarding steps
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PuntaIQ',
    description: 'Let\'s personalize your experience in a few quick steps',
  },
  {
    id: 'favorite-sports',
    title: 'Select Your Favorite Sports',
    description: 'We\'ll focus on showing you predictions for sports you love',
  },
  {
    id: 'favorite-leagues',
    title: 'Select Your Favorite Leagues',
    description: 'Choose the leagues you follow most closely',
  },
  {
    id: 'betting-habits',
    title: 'Your Betting Preferences',
    description: 'Help us understand your betting style',
  },
  {
    id: 'experience-level',
    title: 'Your Experience Level',
    description: 'We\'ll tailor explanations based on your familiarity',
  },
  {
    id: 'prediction-settings',
    title: 'Prediction Settings',
    description: 'Configure how you want to receive predictions',
  },
  {
    id: 'completion',
    title: 'All Set!',
    description: 'Your personalized experience is ready',
  },
];

export function PersonalizedOnboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    isPersonalizedOnboardingVisible: isOpen,
    openPersonalizedOnboarding: openOnboarding,
    closePersonalizedOnboarding: closeOnboarding,
    markPersonalizedOnboardingCompleted
  } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Form state
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [bettingFrequency, setBettingFrequency] = useState<string | null>(null);
  const [predictionTypes, setPredictionTypes] = useState<string[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<string | null>(null);
  const [preferredOddsFormat, setPreferredOddsFormat] = useState('decimal');
  const [predictionsPerDay, setPredictionsPerDay] = useState<number>(5);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  
  // Load user preferences if available
  const {
    data: userPreferences,
    isLoading: preferencesLoading,
  } = useQuery({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user/preferences');
        return await res.json();
      } catch (error) {
        // If there's an error (e.g., preferences don't exist yet), return defaults
        return {
          favoriteSports: [],
          favoriteLeagues: [],
          bettingFrequency: null,
          predictionTypes: [],
          riskTolerance: null,
          preferredOddsFormat: 'decimal',
          predictionsPerDay: 5,
          experienceLevel: null,
          onboardingCompleted: false,
          lastStep: 0,
          completedSteps: [],
        };
      }
    },
    enabled: !!user && isOpen,
  });
  
  // Update form state when user preferences load
  useEffect(() => {
    if (userPreferences) {
      setFavoriteSports(userPreferences.favoriteSports || []);
      setFavoriteLeagues(userPreferences.favoriteLeagues || []);
      setBettingFrequency(userPreferences.bettingFrequency);
      setPredictionTypes(userPreferences.predictionTypes || []);
      setRiskTolerance(userPreferences.riskTolerance);
      setPreferredOddsFormat(userPreferences.preferredOddsFormat || 'decimal');
      setPredictionsPerDay(userPreferences.predictionsPerDay || 5);
      setExperienceLevel(userPreferences.experienceLevel);
      
      // If user has started onboarding before, continue from last step
      if (userPreferences.lastStep > 0 && userPreferences.onboardingCompleted === false) {
        setCurrentStep(userPreferences.lastStep);
      }
    }
  }, [userPreferences]);
  
  // Calculate progress percentage
  useEffect(() => {
    const newProgress = Math.round((currentStep / (ONBOARDING_STEPS.length - 1)) * 100);
    setProgress(newProgress);
  }, [currentStep]);
  
  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const res = await apiRequest('POST', '/api/user/preferences', preferences);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] }); // Also refresh user data
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save preferences',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update step progress
  const saveStepProgress = async () => {
    if (!user) return;
    
    // Determine if this is the final step
    const isComplete = currentStep === ONBOARDING_STEPS.length - 1;
    
    // Build the preferences object
    const preferences = {
      favoriteSports,
      favoriteLeagues,
      bettingFrequency,
      predictionTypes,
      riskTolerance,
      preferredOddsFormat,
      predictionsPerDay,
      experienceLevel,
      onboardingCompleted: isComplete,
      lastStep: currentStep,
      completedSteps: [...(userPreferences?.completedSteps || []), ONBOARDING_STEPS[currentStep].id],
    };
    
    // Save the preferences
    await savePreferencesMutation.mutateAsync(preferences);
  };
  
  // Next step handler
  const handleNextStep = async () => {
    // Validate current step
    if (!isCurrentStepValid()) {
      toast({
        title: 'Please complete this step',
        description: 'Some required selections are missing',
        variant: 'destructive',
      });
      return;
    }
    
    // Save current step progress
    await saveStepProgress();
    
    // Move to next step or close if complete
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Onboarding complete
      markPersonalizedOnboardingCompleted();
      closeOnboarding();
      
      // Show a success notification with a summary of selections
      toast({
        title: 'Personalized Onboarding Complete',
        description: 'Your preferences have been saved. You can view and edit them in your profile settings.',
        variant: 'default',
        duration: 5000,
      });
      
      // Invalidate queries to ensure latest preferences are loaded
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  };
  
  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Check if current step is valid
  const isCurrentStepValid = (): boolean => {
    switch (ONBOARDING_STEPS[currentStep].id) {
      case 'favorite-sports':
        return favoriteSports.length > 0;
      case 'favorite-leagues':
        return favoriteLeagues.length > 0;
      case 'betting-habits':
        return !!bettingFrequency && predictionTypes.length > 0 && !!riskTolerance;
      case 'experience-level':
        return !!experienceLevel;
      case 'prediction-settings':
        return !!preferredOddsFormat && predictionsPerDay > 0;
      default:
        return true;
    }
  };
  
  // The openOnboarding and closeOnboarding functions are now provided by the OnboardingProvider
  // via the useOnboarding hook so we don't need local implementations anymore
  
  // Toggle sport selection
  const toggleSport = (sportId: string) => {
    if (favoriteSports.includes(sportId)) {
      setFavoriteSports(prev => prev.filter(id => id !== sportId));
      
      // Also remove any leagues from this sport
      setFavoriteLeagues(prev => 
        prev.filter(league => {
          // Check if this league belongs to the removed sport
          const sportLeagues = LEAGUES_BY_SPORT[sportId as keyof typeof LEAGUES_BY_SPORT] || [];
          const leagueIds = sportLeagues.map(l => l.id);
          return !leagueIds.includes(league);
        })
      );
    } else {
      setFavoriteSports(prev => [...prev, sportId]);
    }
  };
  
  // Toggle league selection
  const toggleLeague = (leagueId: string) => {
    if (favoriteLeagues.includes(leagueId)) {
      setFavoriteLeagues(prev => prev.filter(id => id !== leagueId));
    } else {
      setFavoriteLeagues(prev => [...prev, leagueId]);
    }
  };
  
  // Toggle prediction type
  const togglePredictionType = (typeId: string) => {
    if (predictionTypes.includes(typeId)) {
      setPredictionTypes(prev => prev.filter(id => id !== typeId));
    } else {
      setPredictionTypes(prev => [...prev, typeId]);
    }
  };
  
  // Render content for the current step
  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <BrainCircuit className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome to PuntaIQ</h2>
              <p className="text-muted-foreground max-w-md">
                Our AI-powered prediction platform is about to get personal. Let's tailor the experience to your preferences.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-primary" />
                    Smart Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Our AI analyzes thousands of data points to provide precise predictions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    Personalized
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Content tailored to your favorite sports, leagues and betting style</p>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <LineChart className="h-5 w-5 mr-2 text-primary" />
                    Track Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Comprehensive analytics to track the performance of your predictions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 'favorite-sports':
        return (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SPORTS_OPTIONS.map(sport => {
                const SportIcon = sport.icon;
                const isSelected = favoriteSports.includes(sport.id);
                
                return (
                  <Button
                    key={sport.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto flex items-center justify-start px-4 py-3 gap-3 text-left relative ${
                      isSelected ? "ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => toggleSport(sport.id)}
                  >
                    <div className={`rounded-full p-2 ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                      <SportIcon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="font-medium">{sport.name}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
            
            <div className="text-sm text-muted-foreground pt-2">
              Select at least one sport to continue
            </div>
          </div>
        );
        
      case 'favorite-leagues':
        return (
          <div className="space-y-6 py-4">
            {favoriteSports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Please go back and select some sports first</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handlePrevStep}
                >
                  Go Back
                </Button>
              </div>
            ) : (
              <>
                {favoriteSports.map(sportId => {
                  const sport = SPORTS_OPTIONS.find(s => s.id === sportId);
                  const leagues = LEAGUES_BY_SPORT[sportId as keyof typeof LEAGUES_BY_SPORT] || [];
                  
                  if (!sport || leagues.length === 0) return null;
                  
                  return (
                    <div key={sportId} className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <sport.icon className="h-4 w-4" />
                        {sport.name} Leagues
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {leagues.map(league => {
                          const isSelected = favoriteLeagues.includes(league.id);
                          
                          return (
                            <Button
                              key={league.id}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`h-auto py-2 justify-start ${
                                isSelected ? "ring-1 ring-primary/20" : ""
                              }`}
                              onClick={() => toggleLeague(league.id)}
                            >
                              {league.name}
                              {isSelected && (
                                <Check className="h-3 w-3 ml-auto text-primary" />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                <div className="text-sm text-muted-foreground pt-2">
                  Select at least one league to continue
                </div>
              </>
            )}
          </div>
        );
        
      case 'betting-habits':
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h3 className="font-medium">How often do you place bets?</h3>
              <RadioGroup 
                value={bettingFrequency || ''} 
                onValueChange={setBettingFrequency}
                className="grid sm:grid-cols-2 gap-2"
              >
                {BETTING_FREQUENCY_OPTIONS.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`frequency-${option.id}`} />
                    <Label htmlFor={`frequency-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium">What type of predictions do you prefer?</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {PREDICTION_TYPE_OPTIONS.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`prediction-type-${option.id}`} 
                      checked={predictionTypes.includes(option.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          togglePredictionType(option.id);
                        } else {
                          togglePredictionType(option.id);
                        }
                      }}
                    />
                    <Label htmlFor={`prediction-type-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium">What's your risk tolerance?</h3>
              <RadioGroup 
                value={riskTolerance || ''} 
                onValueChange={setRiskTolerance}
                className="space-y-2"
              >
                {RISK_TOLERANCE_OPTIONS.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`risk-${option.id}`} />
                    <Label htmlFor={`risk-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'experience-level':
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-medium">What's your sports betting experience level?</h3>
              <p className="text-sm text-muted-foreground">
                This helps us customize the language and depth of our analyses
              </p>
              
              <RadioGroup 
                value={experienceLevel || ''} 
                onValueChange={setExperienceLevel}
                className="space-y-0"
              >
                <div className="grid grid-cols-1 gap-4 pt-2">
                  {EXPERIENCE_LEVEL_OPTIONS.map(option => {
                    const isSelected = experienceLevel === option.id;
                    
                    return (
                      <div key={option.id} className="relative">
                        <RadioGroupItem 
                          value={option.id} 
                          id={`exp-${option.id}`}
                          className="absolute opacity-0"
                        />
                        <Label 
                          htmlFor={`exp-${option.id}`}
                          className="w-full cursor-pointer"
                        >
                          <Card 
                            className={`border transition-all ${
                              isSelected ? "bg-primary/5 border-primary" : "hover:bg-accent"
                            }`}
                          >
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex gap-3 items-center">
                                <div className={`rounded-full h-4 w-4 border flex items-center justify-center ${
                                  isSelected ? "border-2 border-primary" : "border-muted-foreground"
                                }`}>
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {option.label}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {option.id === 'beginner' && "I'm new to sports betting"}
                                    {option.id === 'intermediate' && "I bet occasionally and understand the basics"}
                                    {option.id === 'expert' && "I'm experienced with advanced betting concepts"}
                                  </p>
                                </div>
                              </div>
                              
                              {option.id === 'beginner' && <Zap className="h-5 w-5 text-yellow-500" />}
                              {option.id === 'intermediate' && <Crown className="h-5 w-5 text-primary" />}
                              {option.id === 'expert' && <Trophy className="h-5 w-5 text-amber-500" />}
                            </CardContent>
                          </Card>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'prediction-settings':
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h3 className="font-medium">Preferred odds format</h3>
              <Select 
                value={preferredOddsFormat} 
                onValueChange={setPreferredOddsFormat}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select odds format" />
                </SelectTrigger>
                <SelectContent>
                  {ODDS_FORMAT_OPTIONS.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Number of predictions per day</h3>
                <Badge variant="outline" className="ml-2">
                  {predictionsPerDay}
                </Badge>
              </div>
              <Slider 
                value={[predictionsPerDay]} 
                onValueChange={(value) => setPredictionsPerDay(value[0])}
                min={1}
                max={20}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Few, high quality</span>
                <span>Many options</span>
              </div>
            </div>
          </div>
        );
        
      case 'completion':
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight">Personalization Complete!</h2>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                Your AI sports prediction experience has been customized based on your preferences. Here's a summary of your selections:
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mt-4 text-left">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2">Favorite Sports</h3>
                    <div className="flex flex-wrap gap-1">
                      {favoriteSports.length > 0 ? (
                        favoriteSports.map(sportId => {
                          const sport = SPORTS_OPTIONS.find(s => s.id === sportId);
                          return sport ? (
                            <Badge key={sport.id} variant="secondary" className="mr-1 mb-1">
                              {sport.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground text-xs">None selected</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2">Betting Preferences</h3>
                    {bettingFrequency ? (
                      <Badge variant="secondary" className="mr-1 mb-1">
                        {BETTING_FREQUENCY_OPTIONS.find(b => b.id === bettingFrequency)?.label || bettingFrequency}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">None selected</span>
                    )}
                    {riskTolerance && (
                      <Badge variant="secondary" className="mr-1 mb-1">
                        {RISK_TOLERANCE_OPTIONS.find(r => r.id === riskTolerance)?.label?.split(' ')[0] || riskTolerance}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2">Experience Level</h3>
                    {experienceLevel ? (
                      <Badge variant="secondary">
                        {EXPERIENCE_LEVEL_OPTIONS.find(e => e.id === experienceLevel)?.label || experienceLevel}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">None selected</span>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2">Prediction Settings</h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">
                        <span className="font-medium">Format:</span> {preferredOddsFormat || 'Decimal'}
                      </span>
                      <span className="text-xs">
                        <span className="font-medium">Daily predictions:</span> {predictionsPerDay || 5}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                You can update these preferences any time in your profile settings.
              </p>
              <Button 
                variant="outline" 
                onClick={handleNextStep}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                Complete Setup
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeOnboarding}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10 border-b">
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeOnboarding}
                className="h-7 w-7 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 pt-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center">
                <DialogTitle>{ONBOARDING_STEPS[currentStep].title}</DialogTitle>
                <span className="text-sm text-muted-foreground">
                  {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
              </div>
              <DialogDescription>
                {ONBOARDING_STEPS[currentStep].description}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            {preferencesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : (
              renderStepContent()
            )}
          </div>
          
          <DialogFooter className="p-6 pt-2 border-t">
            <div className="flex w-full justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                disabled={currentStep === 0 || savePreferencesMutation.isPending}
              >
                Back
              </Button>
              
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={savePreferencesMutation.isPending}
              >
                {savePreferencesMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                  'Complete'
                ) : (
                  <>Next <ChevronRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PersonalizedOnboarding;