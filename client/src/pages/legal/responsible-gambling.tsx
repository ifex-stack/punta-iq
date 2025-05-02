import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Heart, Clock, AlertCircle, DollarSign, Headphones, RefreshCw, BarChart4, Shield } from 'lucide-react';

export default function ResponsibleGamblingPage() {
  const [_, navigate] = useLocation();
  
  return (
    <div className="container max-w-4xl py-8 px-4 md:px-0">
      <Helmet>
        <title>Responsible Gambling | PuntaIQ</title>
      </Helmet>
      
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>
      
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-2">Responsible Gambling</h1>
          <p className="text-muted-foreground mb-8">
            Your wellbeing is important to us. PuntaIQ is committed to promoting responsible gambling practices.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border border-muted shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Set Time Limits</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Establish specific time frames for your betting activities and stick to them. Avoid extended sessions that can lead to fatigue and poor decision-making.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-muted shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Budget Wisely</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only bet what you can afford to lose. Set a strict budget for your betting activities and never exceed it, regardless of previous wins or losses.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-muted shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Recognize Warning Signs</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Be aware of signs that gambling may be becoming problematic, such as chasing losses, borrowing money to gamble, or neglecting responsibilities.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-muted shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Maintain Balance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ensure gambling doesn't interfere with your personal relationships, work responsibilities, or other important aspects of your life.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to Responsible Gambling</h2>
            
            <p>
              At PuntaIQ, we are committed to providing a responsible and safe environment for our users. Our platform is designed for entertainment purposes, and we encourage responsible betting practices at all times.
            </p>
            
            <h3 className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Self-Exclusion Options
            </h3>
            <p>
              If you feel that you need to take a break from betting, we offer self-exclusion options that allow you to temporarily or permanently restrict your access to certain features of our service. You can activate these controls in your account settings or by contacting our support team.
            </p>
            
            <h3 className="flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-primary" />
              Deposit Limits
            </h3>
            <p>
              To help manage your spending, you can set daily, weekly, or monthly deposit limits on your account. Once these limits are reached, you won't be able to deposit more funds until the time period resets.
            </p>
            
            <h3 className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-primary" />
              Activity Monitoring
            </h3>
            <p>
              Our systems monitor betting patterns to identify potentially problematic behavior. If we notice signs of risky gambling patterns, we may reach out to offer support and resources.
            </p>
            
            <h2 className="mt-8">Resources for Problem Gambling</h2>
            
            <p>
              If you or someone you know is struggling with gambling-related issues, the following organizations offer confidential support, information, and counseling:
            </p>
            
            <div className="not-prose mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-muted shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">National Gambling Helpline (UK)</h4>
                    <p className="text-sm mb-1">0808 8020 133 (24/7)</p>
                    <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      www.gamcare.org.uk
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="border border-muted shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">BeGambleAware</h4>
                    <p className="text-sm mb-1">0808 8020 133</p>
                    <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      www.begambleaware.org
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="border border-muted shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">Gamblers Anonymous</h4>
                    <a href="https://www.gamblersanonymous.org.uk" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      www.gamblersanonymous.org.uk
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="border border-muted shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">GamStop (Self-Exclusion Service)</h4>
                    <a href="https://www.gamstop.co.uk" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      www.gamstop.co.uk
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <h3 className="flex items-center">
              <Headphones className="h-5 w-5 mr-2 text-primary" />
              Contact Our Support Team
            </h3>
            <p>
              If you have concerns about your gambling habits or need assistance with our responsible gambling tools, please contact our support team at <a href="mailto:support@puntaiq.com" className="text-primary hover:underline">support@puntaiq.com</a>.
            </p>
            
            <div className="bg-muted p-4 rounded-lg mt-8">
              <h4 className="font-semibold mb-2">Important Notice</h4>
              <p className="text-sm mb-0">
                PuntaIQ is a prediction service that provides AI-powered insights for sports events. While our predictions can be used to inform betting decisions, we do not encourage or promote gambling as a way to make money. Always bet responsibly and within your means.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}