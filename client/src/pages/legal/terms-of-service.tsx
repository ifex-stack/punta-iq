import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  const [_, navigate] = useLocation();
  
  return (
    <div className="container max-w-4xl py-8 px-4 md:px-0">
      <Helmet>
        <title>Terms of Service | PuntaIQ</title>
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
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="lead">
              Please read these Terms of Service carefully before using the PuntaIQ mobile application and website (the "Service").
            </p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
            </p>
            
            <h2>2. Description of Service</h2>
            <p>
              PuntaIQ is an AI-powered sports prediction platform that provides predictions, statistics, and analysis for various sports events. Our Service offers:
            </p>
            <ul>
              <li>AI-generated predictions for multiple sports</li>
              <li>Personalized accumulators based on selected preferences</li>
              <li>Sports statistics and analytical insights</li>
              <li>User account management</li>
              <li>Subscription tiers with varying levels of access to premium features</li>
            </ul>
            
            <h2>3. Account Registration and Security</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password and for all activities that occur under your account. You must notify us immediately of any breach of security or unauthorized use of your account.
            </p>
            
            <h2>4. Subscription and Payments</h2>
            <p>
              PuntaIQ offers both free and paid subscription tiers. By selecting a paid subscription, you agree to pay the subscription fees indicated for your selected plan.
            </p>
            <ul>
              <li>All payments are processed securely through our payment processor</li>
              <li>Subscriptions are automatically renewed unless canceled before the renewal date</li>
              <li>Refunds are provided in accordance with our refund policy</li>
              <li>Prices may be subject to change with notice provided to users</li>
              <li>Any applicable taxes will be added to the subscription fees</li>
            </ul>
            
            <h2>5. Content and Predictions</h2>
            <p>
              Our Service provides predictions based on AI algorithms and statistical analysis. Please note:
            </p>
            <ul>
              <li>All predictions are for informational purposes only</li>
              <li>We do not guarantee the accuracy of any predictions or statistical information</li>
              <li>Any use of our predictions for betting or gambling purposes is at your own risk</li>
              <li>We are not responsible for any losses incurred based on our predictions</li>
              <li>Our Service is not a gambling service and does not accept bets</li>
            </ul>
            
            <h2>6. User Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Collect or harvest any personally identifiable information from the Service</li>
              <li>Use the Service for commercial purposes without our express written permission</li>
              <li>Engage in any activity that could damage, disable, or impair the functioning of the Service</li>
            </ul>
            
            <h2>7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by PuntaIQ and are protected by international copyright, trademark, and other intellectual property rights laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service, except as permitted by these Terms.
            </p>
            
            <h2>8. Limitation of Liability</h2>
            <p>
              In no event shall PuntaIQ, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              <li>Decisions made based on predictions or information provided by the Service</li>
            </ul>
            
            <h2>9. Age Restrictions</h2>
            <p>
              Our Service is intended for users who are at least 18 years old. By accessing or using our Service, you represent and warrant that you are at least 18 years of age. If you are under 18 years old, you may not use or register for the Service.
            </p>
            
            <h2>10. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
            
            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
            
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:legal@puntaiq.com">legal@puntaiq.com</a>.
            </p>
            
            <p className="text-sm text-muted-foreground mt-6">Last Updated: May 7, 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}