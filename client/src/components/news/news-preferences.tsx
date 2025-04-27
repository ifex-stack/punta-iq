import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select"; // Assuming you have this component
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define form schema
const preferencesFormSchema = z.object({
  favoriteTeams: z.array(z.string()).optional(),
  favoriteSports: z.array(z.number()).optional(),
  favoriteLeagues: z.array(z.number()).optional(),
  preferredContentTypes: z.array(z.string()).min(1, {
    message: "Please select at least one content type",
  }),
  excludedTags: z.array(z.string()).optional(),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export function NewsPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch existing preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery({
    queryKey: ["/api/news/preferences"],
    enabled: !!user,
  });
  
  // Fetch sports for dropdown
  const { data: sports } = useQuery({
    queryKey: ["/api/sports"],
  });
  
  // Fetch leagues for dropdown
  const { data: leagues } = useQuery({
    queryKey: ["/api/leagues"],
  });
  
  // Initialize form with default values
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      favoriteTeams: [],
      favoriteSports: [],
      favoriteLeagues: [],
      preferredContentTypes: ["article", "analysis"],
      excludedTags: [],
    },
  });
  
  // Update form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        favoriteTeams: preferences.favoriteTeams || [],
        favoriteSports: preferences.favoriteSports || [],
        favoriteLeagues: preferences.favoriteLeagues || [],
        preferredContentTypes: preferences.preferredContentTypes || ["article", "analysis"],
        excludedTags: preferences.excludedTags || [],
      });
    }
  }, [preferences, form]);
  
  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (values: PreferencesFormValues) => {
      return await apiRequest("POST", "/api/news/preferences", values);
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your news preferences have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/feed/personalized"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: PreferencesFormValues) => {
    savePreferencesMutation.mutate(values);
  };
  
  // Early return if user not logged in
  if (!user) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>News Preferences</CardTitle>
          <CardDescription>Sign in to customize your news feed</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Content types options
  const contentTypeOptions = [
    { value: "article", label: "Article" },
    { value: "analysis", label: "Analysis" },
    { value: "preview", label: "Match Preview" },
    { value: "recap", label: "Match Recap" },
    { value: "interview", label: "Interview" },
    { value: "opinion", label: "Opinion" },
  ];
  
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>News Preferences</CardTitle>
        <CardDescription>Customize your news feed to see the content you care about</CardDescription>
      </CardHeader>
      
      <CardContent>
        {loadingPreferences ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="preferredContentTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Types</FormLabel>
                    <FormDescription>
                      Select the types of content you want to see in your feed
                    </FormDescription>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {contentTypeOptions.map((type) => (
                        <FormItem
                          key={type.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type.value)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...field.value, type.value]
                                  : field.value.filter((value) => value !== type.value);
                                field.onChange(updatedValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{type.label}</FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="favoriteSports"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Sports</FormLabel>
                    <FormDescription>
                      Select the sports you're interested in
                    </FormDescription>
                    <FormControl>
                      {sports ? (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {sports.map((sport: any) => (
                            <FormItem
                              key={sport.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sport.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), sport.id]
                                      : (field.value || []).filter((id) => id !== sport.id);
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{sport.name}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Loading sports...</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="favoriteLeagues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Leagues</FormLabel>
                    <FormDescription>
                      Select the leagues you want to follow
                    </FormDescription>
                    <FormControl>
                      {leagues ? (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {leagues.map((league: any) => (
                            <FormItem
                              key={league.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(league.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), league.id]
                                      : (field.value || []).filter((id) => id !== league.id);
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{league.name}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Loading leagues...</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="favoriteTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Teams</FormLabel>
                    <FormDescription>
                      Enter the names of teams you follow (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const teams = e.target.value
                            .split(",")
                            .map((team) => team.trim())
                            .filter((team) => team !== "");
                          field.onChange(teams);
                        }}
                        placeholder="Liverpool, Manchester United, Chelsea"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={savePreferencesMutation.isPending}
                  className="flex gap-2"
                >
                  {savePreferencesMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}