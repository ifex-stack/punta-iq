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
            <h2>1. Introduction</h2>
            <p>
              Welcome to PuntaIQ ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the PuntaIQ platform, including our mobile application, website, and related services (collectively, the "Service").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
            
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are at least 18 years old and that you have the right, authority, and capacity to enter into these Terms.
            </p>
            <p>
              The Service is not available to persons under the age of 18 or to anyone previously suspended or removed from the Service by PuntaIQ. By using the Service, you represent and warrant that you have not previously been suspended or removed from the Service.
            </p>
            
            <h2>3. Use of Our Service</h2>
            <p>
              PuntaIQ provides an AI-powered sports prediction platform for informational and entertainment purposes only. Our Service includes predictions, statistics, accumulators, and other features related to sports events.
            </p>
            <p>
              You acknowledge and agree that:
            </p>
            <ul>
              <li>The Service is for informational and entertainment purposes only;</li>
              <li>The predictions and information provided by the Service are based on AI algorithms and may not be accurate;</li>
              <li>PuntaIQ is not responsible for any losses incurred as a result of using our predictions or information;</li>
              <li>You are solely responsible for your decisions and actions based on the information provided by the Service;</li>
              <li>You will use the Service in compliance with all applicable laws and regulations.</li>
            </ul>
            
            <h2>4. Responsible Gambling</h2>
            <p>
              PuntaIQ promotes responsible gambling practices. We encourage users to:
            </p>
            <ul>
              <li>Set limits on time and money spent on gambling activities;</li>
              <li>Never chase losses or gamble to make money;</li>
              <li>Not gamble when under the influence of alcohol or when upset or depressed;</li>
              <li>Balance gambling with other activities;</li>
              <li>Seek help if gambling becomes a problem.</li>
            </ul>
            <p>
              If you or someone you know has a gambling problem, please contact the following resources for help:
            </p>
            <ul>
              <li>National Gambling Helpline: 0808 8020 133 (UK)</li>
              <li>BeGambleAware: www.begambleaware.org</li>
              <li>Gamblers Anonymous: www.gamblersanonymous.org</li>
              <li>National Council on Problem Gambling: www.ncpgambling.org (US)</li>
            </ul>
            
            <h2>5. Subscriptions and Payments</h2>
            <p>
              PuntaIQ offers subscription plans with different features and pricing. By subscribing to a paid plan, you agree to pay the subscription fees indicated at the time of purchase. Subscription fees are non-refundable except as required by law or as explicitly stated in these Terms.
            </p>
            <p>
              Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date. You can cancel your subscription at any time through your account settings or by contacting customer support.
            </p>
            
            <h2>6. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify PuntaIQ immediately of any unauthorized use of your account or any other breach of security.
            </p>
            
            <h2>7. Content and Intellectual Property</h2>
            <p>
              All content and materials available through the Service, including but not limited to text, graphics, logos, images, data compilations, and software, are the property of PuntaIQ or its licensors and protected by intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of our Service or included content, nor may you reverse engineer or attempt to extract the source code of our software, unless you have our written permission.
            </p>
            
            <h2>8. User Content</h2>
            <p>
              By submitting, posting, or displaying content on or through the Service, you grant PuntaIQ a worldwide, non-exclusive, royalty-free license to use, copy, modify, and display such content in connection with providing and promoting the Service.
            </p>
            <p>
              You represent and warrant that you have all rights necessary to grant these licenses and that your content does not violate any third-party rights or applicable laws.
            </p>
            
            <h2>9. Prohibited Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law;</li>
              <li>Harass, abuse, or harm another person;</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent yourself;</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service;</li>
              <li>Attempt to gain unauthorized access to the Service, user accounts, or computer systems;</li>
              <li>Use any automated means to access the Service;</li>
              <li>Use the Service to send unsolicited communications, promotions, or advertisements;</li>
              <li>Share your account or account credentials with others.</li>
            </ul>
            
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PuntaIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the Service;</li>
              <li>Any conduct or content of any third party on the Service;</li>
              <li>Any content obtained from the Service; or</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
            
            <h2>11. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement. PuntaIQ does not warrant that the Service will be uninterrupted or error-free, that defects will be corrected, or that the Service or the servers that make it available are free of viruses or other harmful components.
            </p>
            
            <h2>12. Changes to Terms</h2>
            <p>
              PuntaIQ reserves the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on the Service and updating the "Last Updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
            
            <h2>13. Termination</h2>
            <p>
              PuntaIQ may terminate or suspend your access to all or part of the Service, without notice, for conduct that PuntaIQ believes violates these Terms or is harmful to other users of the Service, PuntaIQ, or third parties, or for any other reason.
            </p>
            
            <h2>14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
            </p>
            
            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms or the Service, please contact us at support@puntaiq.com.
            </p>
            
            <p className="text-sm text-muted-foreground mt-6">Last Updated: May 2, 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}