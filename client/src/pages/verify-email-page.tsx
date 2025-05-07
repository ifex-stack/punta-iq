import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  // Get token from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  useEffect(() => {
    // If already logged in and email is verified, redirect to home
    if (user && user.isEmailVerified) {
      navigate('/');
      return;
    }

    // If no token, show error
    if (!token) {
      setIsVerifying(false);
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    // Verify email with token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest('POST', '/api/verify-email', { token });
        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          // If user is logged in, refresh the user data to update the email verification status
          if (user) {
            // The queryClient.invalidateQueries is handled in the useAuth hook's refetch
          }
          toast({
            title: 'Email Verified',
            description: 'Your email has been verified successfully.',
          });
        } else {
          setVerificationStatus('error');
          setErrorMessage(data.message || 'Failed to verify email');
          toast({
            title: 'Verification Failed',
            description: data.message || 'Failed to verify your email',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again later.');
        toast({
          title: 'Verification Error',
          description: 'An unexpected error occurred. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, user, navigate, toast]);

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Email Verification</CardTitle>
          <CardDescription>
            {isVerifying
              ? 'We are verifying your email address...'
              : verificationStatus === 'success'
              ? 'Your email has been verified successfully!'
              : 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground text-center">Please wait while we verify your email...</p>
            </div>
          ) : verificationStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">Your email has been verified successfully. You can now use all features of PuntaIQ.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-center text-destructive">{errorMessage}</p>
              <div className="rounded-lg bg-muted p-4 w-full">
                <p className="text-sm text-muted-foreground">
                  If you're having trouble verifying your email, you can request a new verification link from your profile settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            {verificationStatus === 'success' ? (
              <Button className="w-full" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button className="w-full" variant="outline" onClick={() => navigate('/auth')}>
                  Return to Login
                </Button>
                {verificationStatus === 'error' && (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/support">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Support
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}