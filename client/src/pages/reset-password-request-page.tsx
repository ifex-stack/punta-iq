import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Form validation schema
const resetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;

export default function ResetPasswordRequestPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const onSubmit = async (values: ResetRequestFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/reset-password-request', values);
      const data = await response.json();

      if (response.ok) {
        setRequestSent(true);
        setUserEmail(values.email);
        toast({
          title: 'Reset Request Sent',
          description: 'If your email exists in our system, you will receive a password reset link',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: data.message || 'Failed to send reset request. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
          <CardDescription>
            {!requestSent
              ? 'Enter your email and we will send you a password reset link'
              : 'Check your email for the reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!requestSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="flex">
                  <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Reset link sent</h3>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>
                        If an account exists for <span className="font-medium">{userEmail}</span>, you will receive an email with a link to reset your password.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        onClick={() => {
                          setRequestSent(false);
                          form.reset();
                        }}
                      >
                        Request again
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/auth">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}