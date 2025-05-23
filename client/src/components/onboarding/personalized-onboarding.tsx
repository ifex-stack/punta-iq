import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, ChevronRight, Sparkle, Target, Zap, Users, Clock, Flag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { Globe } from "lucide-react";

// Step definitions
const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Let's get you started with PuntaIQ",
  },
  {
    id: "sports",
    title: "Sports",
    description: "Select your favorite sports",
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Tell us about your betting preferences",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Customize your experience",
  },
  {
    id: "summary",
    title: "Summary",
    description: "Review your personalized setup",
  },
];

// Sports list
const SPORTS_LIST = [
  { id: "football", name: "Football (Soccer)", icon: "⚽" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "baseball", name: "Baseball", icon: "⚾" },
  { id: "hockey", name: "Hockey", icon: "🏒" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "rugby", name: "Rugby", icon: "🏉" },
  { id: "golf", name: "Golf", icon: "⛳" },
  { id: "mma", name: "MMA", icon: "🥊" },
  { id: "boxing", name: "Boxing", icon: "🥊" },
  { id: "esports", name: "Esports", icon: "🎮" },
];

// Form schema
const onboardingSchema = z.object({
  favoriteSports: z.array(z.string()).min(1, "Please select at least one sport"),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]),
  bettingFrequency: z.enum(["daily", "weekly", "occasional"]),
  riskTolerance: z.enum(["low", "medium", "high"]),
  preferredOddsFormat: z.enum(["decimal", "fractional", "american", "hongkong", "indonesian", "malay"]),
  notificationTime: z.string().optional(),
  predictionsPerDay: z.number().min(1).max(20),
  analysisDepth: z.enum(["simplified", "detailed"]),
  marketPreferences: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  selectedCurrency: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface PersonalizedOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalizedOnboarding({ open, onOpenChange }: PersonalizedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  
  // Default form values
  const defaultValues: OnboardingFormValues = {
    favoriteSports: [],
    experienceLevel: "intermediate",
    bettingFrequency: "weekly",
    riskTolerance: "medium",
    preferredOddsFormat: "decimal",
    notificationTime: "09:00",
    predictionsPerDay: 5,
    analysisDepth: "detailed",
    marketPreferences: ["match_winner", "over_under", "both_teams_to_score"],
    themes: ["value_bets", "form_analysis"],
    selectedCurrency: currency.code,
  };
  
  // Initialize form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
  });
  
  // Handle form submission
  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      // Check if user is logged in first
      if (!user) {
        // Not logged in - let's open the auth page
        toast({
          title: "Login required",
          description: "Please sign in or register to save your preferences",
          variant: "default",
        });
        
        // Close the onboarding dialog
        onOpenChange(false);
        
        // Redirect to auth page
        window.location.href = "/auth";
        return;
      }
      
      // Prepare data for submission with the right structure to match schema
      const completeData = {
        // Include only the fields that match our schema and avoid nested objects
        favoriteSports: data.favoriteSports || [],
        experienceLevel: data.experienceLevel || "intermediate",
        bettingFrequency: data.bettingFrequency || "weekly",
        riskTolerance: data.riskTolerance || "medium",
        preferredOddsFormat: data.preferredOddsFormat || "decimal",
        predictionsPerDay: data.predictionsPerDay || 5,
        analysisDepth: data.analysisDepth || "detailed",
        marketPreferences: data.marketPreferences || [],
        themes: data.themes || [],
        
        // Add onboarding status flags
        onboardingCompleted: true,
        lastStep: ONBOARDING_STEPS.length - 1,
        completedSteps: ONBOARDING_STEPS.map(step => step.id)
      };
      
      console.log("Saving user preferences:", completeData);
      
      try {
        // Show a loading toast without attempting to dismiss it later
        toast({
          title: "Saving preferences...",
          description: "Please wait while we save your settings",
        });
        
        // Make the API request with better error handling
        const response = await apiRequest("POST", "/api/user/preferences", completeData);
        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          toast({
            title: "Preferences saved",
            description: "Your personalized settings have been saved successfully",
            variant: "default",
          });
          
          // Update client-side currency if it changed
          if (data.selectedCurrency && data.selectedCurrency !== currency.code) {
            changeCurrency(data.selectedCurrency);
          }
          
          // Invalidate the preferences query to refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
          
          // Success - close the dialog
          onOpenChange(false);
        } else {
          // Handle specific error cases
          if (response.status === 401) {
            toast({
              title: "Authentication error",
              description: "Your session has expired. Please log in again to save your preferences.",
              variant: "destructive",
            });
            
            // Redirect to auth page
            setTimeout(() => {
              window.location.href = "/auth";
            }, 1500);
            return;
          } else {
            // Handle server error with details if available
            const errorMessage = responseData?.details || responseData?.message || `Error code: ${response.status}`;
            throw new Error(`Failed to save preferences: ${errorMessage}`);
          }
        }
      } catch (error: any) {
        console.error("API request error:", error);
        
        toast({
          title: "Error saving preferences",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error in onboarding form submission:", error);
      
      toast({
        title: "Form submission error",
        description: "There was a problem with your submission. Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Helper function for completion percentage
  const calculateCompletion = () => {
    return Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkle className="h-6 w-6 text-primary" />
            {ONBOARDING_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription>
            {ONBOARDING_STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${calculateCompletion()}%` }}
          />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-lg text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Personalize Your PuntaIQ Experience</h3>
                  <p className="text-muted-foreground">
                    Welcome to PuntaIQ! We'll help you set up your profile to get the most relevant 
                    predictions and features. This will only take a minute.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md flex flex-col items-center text-center">
                    <Target className="h-8 w-8 text-blue-500 mb-2" />
                    <h4 className="font-medium mb-1">Tailored Predictions</h4>
                    <p className="text-sm text-muted-foreground">Get predictions for the sports you care about</p>
                  </div>
                  <div className="p-4 border rounded-md flex flex-col items-center text-center">
                    <Users className="h-8 w-8 text-green-500 mb-2" />
                    <h4 className="font-medium mb-1">Fantasy Contests</h4>
                    <p className="text-sm text-muted-foreground">Join contests matched to your experience level</p>
                  </div>
                  <div className="p-4 border rounded-md flex flex-col items-center text-center">
                    <Flag className="h-8 w-8 text-amber-500 mb-2" />
                    <h4 className="font-medium mb-1">Currency Preferences</h4>
                    <p className="text-sm text-muted-foreground">Set your preferred currency for all transactions</p>
                  </div>
                </div>
                
                <div className="flex items-center border-t border-b py-4 mt-6">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-sm text-muted-foreground">
                    Your preferences help us personalize your experience. You can change these settings at any time.
                  </p>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="favoriteSports"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select your favorite sports</FormLabel>
                      <FormDescription>
                        Choose the sports you want to receive predictions for
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {SPORTS_LIST.map((sport) => {
                          const isSelected = field.value.includes(sport.id);
                          return (
                            <FormItem
                              key={sport.id}
                              className="flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-muted/50"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    // Only update the array when the checkbox state actually changes
                                    const newValue = checked 
                                      ? [...field.value, sport.id]
                                      : field.value.filter(id => id !== sport.id);
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <div 
                                className="flex items-center space-x-2"
                                onClick={() => {
                                  // Handle click on label separately
                                  const newValue = isSelected
                                    ? field.value.filter(id => id !== sport.id)
                                    : [...field.value, sport.id];
                                  field.onChange(newValue);
                                }}
                              >
                                <span className="text-lg">{sport.icon}</span>
                                <span>{sport.name}</span>
                              </div>
                            </FormItem>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Experience Level</FormLabel>
                      <FormDescription>
                        How would you describe your sports betting experience?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="beginner" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Beginner - I'm new to sports betting
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="intermediate" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Intermediate - I have some experience
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="expert" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Expert - I'm very experienced
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bettingFrequency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Betting Frequency</FormLabel>
                      <FormDescription>
                        How often do you typically place bets?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Daily - I bet almost every day
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="weekly" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Weekly - I bet a few times per week
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="occasional" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Occasional - I bet once in a while
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskTolerance"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Risk Tolerance</FormLabel>
                      <FormDescription>
                        What level of risk are you comfortable with?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Low Risk - I prefer safer bets with higher probability
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Medium Risk - I'm comfortable with moderate risk
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              High Risk - I'm willing to take bigger risks for higher returns
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredOddsFormat"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Preferred Odds Format</FormLabel>
                      <FormDescription>
                        How would you like odds to be displayed?
                      </FormDescription>
                      <FormControl>
                        <Tabs 
                          value={field.value} 
                          onValueChange={field.onChange}
                          className="w-full"
                        >
                          <TabsList className="grid grid-cols-3 mb-2">
                            <TabsTrigger value="decimal">Decimal</TabsTrigger>
                            <TabsTrigger value="fractional">Fractional</TabsTrigger>
                            <TabsTrigger value="american">American</TabsTrigger>
                          </TabsList>
                          <div className="border rounded-md p-4 text-center">
                            <div className="font-medium mb-1">Example:</div>
                            <div className="text-sm text-muted-foreground">
                              {field.value === "decimal" && "1.75 (European style)"}
                              {field.value === "fractional" && "3/4 (UK style)"}
                              {field.value === "american" && "-133 or +133 (US style)"}
                            </div>
                          </div>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="notificationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Notification Time</FormLabel>
                      <FormDescription>
                        When would you like to receive your daily predictions?
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            {...field}
                            className="w-32"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="predictionsPerDay"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormLabel>Number of Predictions Per Day</FormLabel>
                      <FormDescription>
                        How many predictions would you like to receive each day?
                      </FormDescription>
                      <div className="pt-2">
                        <FormControl>
                          <div className="space-y-3">
                            <Slider
                              min={1}
                              max={20}
                              step={1}
                              defaultValue={[value]}
                              onValueChange={(vals) => onChange(vals[0])}
                            />
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Fewer</span>
                              <span className="font-medium">{value} predictions</span>
                              <span className="text-sm text-muted-foreground">More</span>
                            </div>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="analysisDepth"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Analysis Detail Level</FormLabel>
                      <FormDescription>
                        How detailed would you like the prediction analyses to be?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="simplified" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Simplified - Just the essentials and predictions
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border rounded-md p-3">
                            <FormControl>
                              <RadioGroupItem value="detailed" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Detailed - Comprehensive analysis with statistics
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="selectedCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Currency</FormLabel>
                      <FormDescription>
                        Select your preferred currency for odds and payments
                      </FormDescription>
                      <div className="pt-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <CurrencySelector 
                            variant="outline" 
                            showLabel={true}
                          />
                          <input 
                            type="hidden" 
                            {...field}
                            value={currency.code}
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border rounded-md p-6 bg-muted/20">
                  <h3 className="text-lg font-medium mb-3">Your Personalized Setup Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Favorite Sports</h4>
                      <div className="flex flex-wrap gap-2">
                        {form.watch("favoriteSports").map((sportId) => {
                          const sport = SPORTS_LIST.find((s) => s.id === sportId);
                          return sport ? (
                            <div key={sportId} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                              <span className="mr-1">{sport.icon}</span> {sport.name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Experience Level</h4>
                        <p className="text-sm capitalize">{form.watch("experienceLevel")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Betting Frequency</h4>
                        <p className="text-sm capitalize">{form.watch("bettingFrequency")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Risk Tolerance</h4>
                        <p className="text-sm capitalize">{form.watch("riskTolerance")} Risk</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Odds Format</h4>
                        <p className="text-sm capitalize">{form.watch("preferredOddsFormat")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Notification Time</h4>
                        <p className="text-sm">{form.watch("notificationTime")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Predictions Per Day</h4>
                        <p className="text-sm">{form.watch("predictionsPerDay")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Analysis Detail</h4>
                        <p className="text-sm capitalize">{form.watch("analysisDepth")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-muted-foreground">Preferred Currency</h4>
                        <p className="text-sm">{form.watch("selectedCurrency")}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-primary/5">
                  <div className="flex items-start">
                    <Sparkle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Ready to go!</h4>
                      <p className="text-sm text-muted-foreground">
                        Your personalized PuntaIQ experience is ready. You can change these settings any time from your profile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between items-center gap-2 pt-2">
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div></div> // empty div to maintain layout
              )}
              
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">Complete Setup</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}