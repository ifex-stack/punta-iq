import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ChevronLeft, MessageSquare, Share2, Star, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "compliment", "other"]),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100),
  message: z.string().min(10, "Feedback must be at least 10 characters").max(1000),
  rating: z.number().min(1).max(5).optional(),
  email: z.string().email("Please enter a valid email").optional(),
});

export default function FeedbackPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "suggestion",
      subject: "",
      message: "",
      rating: 0,
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof feedbackSchema>) => {
    try {
      await apiRequest('POST', '/api/feedback', {
        ...data,
        userId: user?.id,
      });
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });
      
      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PuntaIQ - AI-Powered Sports Predictions',
          text: 'Check out PuntaIQ, an AI-powered sports prediction platform with amazing features!',
          url: window.location.origin,
        });
        
        toast({
          title: "Thanks for sharing!",
          description: "We appreciate your support.",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast({
            title: "Sharing failed",
            description: "Please try a different method",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      try {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied to clipboard",
          description: "Share the link with your friends!",
        });
      } catch (error) {
        toast({
          title: "Copying failed",
          description: "Please copy the URL manually",
          variant: "destructive",
        });
      }
    }
    
    setIsSharing(false);
  };

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              Feedback and Suggestions
            </CardTitle>
            <CardDescription>
              We value your input to improve our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Thank You!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We appreciate you taking the time to provide feedback. Your input helps us improve PuntaIQ for everyone.
                </p>
                <Button 
                  onClick={() => setIsSubmitted(false)} 
                  variant="outline" 
                  className="mt-4"
                >
                  Submit Another Feedback
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback Type</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="suggestion">Suggestion</option>
                            <option value="bug">Bug Report</option>
                            <option value="compliment">Compliment</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of your feedback" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what you think or suggest improvements..." 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your detailed thoughts help us improve
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Your Experience (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                className={`text-2xl focus:outline-none ${
                                  field.value >= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                                }`}
                                onClick={() => form.setValue('rating', rating)}
                              >
                                <Star className="w-8 h-8" fill={field.value >= rating ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!user && (
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Your email for follow-up" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            We'll only use this to follow up on your feedback if needed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button type="submit" className="w-full">
                    Submit Feedback
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Share2 className="h-5 w-5 text-primary" />
              Share PuntaIQ
            </CardTitle>
            <CardDescription>
              Enjoying our platform? Share it with friends and fellow sports enthusiasts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Help us grow by sharing PuntaIQ with your friends and fellow sports enthusiasts.
              </p>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={handleShare}
                disabled={isSharing}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {isSharing ? "Sharing..." : "Share PuntaIQ"}
              </Button>
              
              <div className="pt-4 text-sm text-muted-foreground">
                <p>You can also find us on:</p>
                <div className="flex justify-center gap-4 mt-2">
                  <a href="https://twitter.com/puntaiq" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter</a>
                  <a href="https://facebook.com/puntaiq" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook</a>
                  <a href="https://instagram.com/puntaiq" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram</a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}