import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Clock3, Info, ShieldOff, ShieldX, UserX } from "lucide-react";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const timeoutSchema = z.object({
  duration: z.string().min(1, "Please select a duration"),
  reason: z.string().optional(),
});

const selfExcludeSchema = z.object({
  period: z.enum(["6months", "1year", "2years", "5years", "permanent"]),
  reason: z.string().optional(),
  confirmExclusion: z.boolean().refine(val => val === true, {
    message: "You must confirm your decision"
  })
});

export function GamblingControls() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const timeoutForm = useForm<z.infer<typeof timeoutSchema>>({
    resolver: zodResolver(timeoutSchema),
    defaultValues: {
      duration: "",
      reason: "",
    },
  });

  const selfExcludeForm = useForm<z.infer<typeof selfExcludeSchema>>({
    resolver: zodResolver(selfExcludeSchema),
    defaultValues: {
      period: "6months",
      reason: "",
      confirmExclusion: false,
    },
  });

  const onTimeoutSubmit = async (data: z.infer<typeof timeoutSchema>) => {
    try {
      await apiRequest('POST', '/api/user/timeout', {
        userId: user?.id,
        duration: data.duration,
        reason: data.reason || "Not specified",
      });
      
      toast({
        title: "Time-out set",
        description: `Your account will be temporarily restricted for ${data.duration}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to set time-out",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const onSelfExcludeSubmit = async (data: z.infer<typeof selfExcludeSchema>) => {
    try {
      await apiRequest('POST', '/api/user/self-exclude', {
        userId: user?.id,
        period: data.period,
        reason: data.reason || "Not specified",
      });
      
      toast({
        title: "Self-exclusion set",
        description: "Your self-exclusion has been processed",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to set self-exclusion",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleAccountClose = async () => {
    try {
      await apiRequest('POST', '/api/user/close-account', {
        userId: user?.id,
      });
      
      toast({
        title: "Account closure requested",
        description: "Your account will be closed within 24 hours",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: "Failed to process account closure",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6 max-w-3xl mx-auto">
      <Card className="mb-8">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldOff className="h-5 w-5 text-primary" />
            Responsible Gambling Controls
          </CardTitle>
          <CardDescription>
            Tools to help you manage your gambling activity
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-md flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Responsible gambling reminder</p>
                <p className="mt-1">Our prediction service is intended for entertainment purposes. Please gamble responsibly and only bet what you can afford to lose. If you're concerned about your gambling habits, please use the controls below.</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="timeout">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    <span>Time-out (Cool-off period)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Take a short break from your account. During this period, you will not be able to place bets or access certain features.
                    </p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Set a Time-out</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set a Time-out Period</DialogTitle>
                          <DialogDescription>
                            Choose how long you would like to take a break from our services.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...timeoutForm}>
                          <form onSubmit={timeoutForm.handleSubmit(onTimeoutSubmit)} className="space-y-4">
                            <FormField
                              control={timeoutForm.control}
                              name="duration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Duration</FormLabel>
                                  <FormControl>
                                    <select
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      {...field}
                                    >
                                      <option value="">Select a duration</option>
                                      <option value="24hours">24 hours</option>
                                      <option value="48hours">48 hours</option>
                                      <option value="7days">7 days</option>
                                      <option value="14days">14 days</option>
                                      <option value="30days">30 days</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={timeoutForm.control}
                              name="reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reason (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Why are you taking a break?" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    This helps us improve our services
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit">Confirm Time-out</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="self-exclusion">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4" />
                    <span>Self-exclusion</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Self-exclusion is for longer periods when you want to stop gambling completely. You cannot reverse this decision until the exclusion period ends.
                    </p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Self-exclude</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Self-exclusion</DialogTitle>
                          <DialogDescription>
                            This will restrict access to your account for the selected period. This action cannot be reversed until the period ends.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...selfExcludeForm}>
                          <form onSubmit={selfExcludeForm.handleSubmit(onSelfExcludeSubmit)} className="space-y-4">
                            <FormField
                              control={selfExcludeForm.control}
                              name="period"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exclusion Period</FormLabel>
                                  <FormControl>
                                    <select
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      {...field}
                                    >
                                      <option value="6months">6 months</option>
                                      <option value="1year">1 year</option>
                                      <option value="2years">2 years</option>
                                      <option value="5years">5 years</option>
                                      <option value="permanent">Permanent</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={selfExcludeForm.control}
                              name="reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reason (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Why are you self-excluding?" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    This helps us improve our services
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={selfExcludeForm.control}
                              name="confirmExclusion"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 mt-1"
                                      checked={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      I understand that my account will be restricted and this action cannot be undone until the exclusion period ends
                                    </FormLabel>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit" variant="destructive">Confirm Self-exclusion</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="account-closure">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    <span>Account Closure</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently close your account. This will remove your data in accordance with our privacy policy and regulatory requirements.
                    </p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Close Account</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Close Your Account</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to close your account? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md text-sm mb-4">
                          <p className="font-medium">Warning</p>
                          <p className="mt-1">
                            Your account will be permanently closed and all personal data will be removed in accordance with our privacy policy and regulatory requirements.
                          </p>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            const dialog = document.querySelector('[role="dialog"]');
                            if (dialog instanceof HTMLElement) {
                              dialog.close();
                            }
                          }}>Cancel</Button>
                          <Button variant="destructive" onClick={handleAccountClose}>Confirm Closure</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            If you are concerned about your gambling habits, please contact one of the following support organizations:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><a href="https://www.begambleaware.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BeGambleAware</a> - 0808 8020 133</li>
            <li><a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GamCare</a> - 0808 8020 133</li>
            <li><a href="https://www.gamblingtherapy.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Gambling Therapy</a> - Global support</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}