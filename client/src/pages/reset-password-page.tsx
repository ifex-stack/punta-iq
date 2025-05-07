import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'loading'>('loading');
  const [tokenError, setTokenError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    // Validate the token
    if (!token) {
      setTokenStatus('invalid');
      setTokenError('No reset token provided');
      return;
    }

    // Here we would ideally validate the token on the server before letting the user enter a new password
    // For simplicity in this example, we'll just set it as valid
    // In a real implementation, you would make an API request to validate the token
    setTokenStatus('valid');
  }, [token]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'No reset token provided',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/reset-password', {
        token,
        newPassword: values.newPassword,
      });
      
      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: 'Password Reset',
          description: 'Your password has been reset successfully. You can now log in.',
        });
      } else {
        toast({
          title: 'Reset Failed',
          description: data.message || 'Failed to reset password. Please try again.',
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
            {tokenStatus === 'loading'
              ? 'Validating your reset token...'
              : tokenStatus === 'invalid'
              ? 'Invalid or expired reset token'
              : resetSuccess
              ? 'Your password has been reset successfully'
              : 'Enter your new password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {tokenStatus === 'loading' ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tokenStatus === 'invalid' ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Token</AlertTitle>
              <AlertDescription>
                {tokenError || 'Your password reset link is invalid or has expired. Please request a new one.'}
              </AlertDescription>
            </Alert>
          ) : resetSuccess ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-foreground">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {(tokenStatus === 'invalid' || resetSuccess) && (
            <Button variant="outline" asChild>
              <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}