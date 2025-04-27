import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft } from 'lucide-react';

// Define the fantasy team creation schema
const fantasyTeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters').max(30, 'Team name must not exceed 30 characters'),
  contestId: z.string().min(1, 'Please select a contest'),
  formation: z.string().min(1, 'Please select a formation'),
});

type FantasyTeamFormValues = z.infer<typeof fantasyTeamSchema>;

export default function FantasyContestCreatePage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FantasyTeamFormValues>({
    resolver: zodResolver(fantasyTeamSchema),
    defaultValues: {
      name: '',
      contestId: '',
      formation: '4-4-2',
    },
  });

  async function onSubmit(data: FantasyTeamFormValues) {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create a fantasy team',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/fantasy/teams', {
        ...data,
        contestId: parseInt(data.contestId),
        userId: user.id,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Team created successfully',
          description: `${data.name} has been created. Now let's build your squad!`,
        });
        
        // Redirect to the team building page
        setLocation(`/fantasy/teams/${result.id}/build`);
      } else {
        throw new Error(result.message || 'Failed to create team');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to create team',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => setLocation('/fantasy/contests')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contests
      </Button>
      
      <h1 className="text-3xl font-bold tracking-tight mb-2">Create Your Fantasy Team</h1>
      <p className="text-muted-foreground mb-6">Setup your team details before selecting players</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Give your team a name and select which contest you'd like to enter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your team name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a unique and creative name for your team
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contest</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contest" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Weekly Warrior Challenge</SelectItem>
                        <SelectItem value="2">Rookie Cup</SelectItem>
                        <SelectItem value="3">Weekend Showdown</SelectItem>
                        {user?.subscriptionTier === 'premium' && (
                          <>
                            <SelectItem value="4">Champions League</SelectItem>
                            <SelectItem value="5">Elite Manager Challenge</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the contest you want to enter with this team
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="formation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formation</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a formation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="4-4-2">4-4-2</SelectItem>
                        <SelectItem value="4-3-3">4-3-3</SelectItem>
                        <SelectItem value="3-5-2">3-5-2</SelectItem>
                        <SelectItem value="5-3-2">5-3-2</SelectItem>
                        <SelectItem value="4-5-1">4-5-1</SelectItem>
                        <SelectItem value="3-4-3">3-4-3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your team's starting formation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="px-0 pt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Team & Continue'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}