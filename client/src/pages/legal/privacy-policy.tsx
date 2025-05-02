import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [_, navigate] = useLocation();
  
  return (
    <div className="container max-w-4xl py-8 px-4 md:px-0">
      <Helmet>
        <title>Privacy Policy | PuntaIQ</title>
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
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="lead">
              At PuntaIQ, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            
            <h2>1. Information We Collect</h2>
            <p>
              We collect several types of information from and about users of our Service:
            </p>
            <h3>Personal Information</h3>
            <p>
              When you register, subscribe, or otherwise use our Service, we may collect:
            </p>
            <ul>
              <li>Contact information (name, email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (processed securely through our payment processors)</li>
              <li>User preferences and settings</li>
              <li>Location information (country, city, timezone)</li>
              <li>Device information (device ID, IP address, operating system)</li>
            </ul>
            
            <h3>Usage Information</h3>
            <p>
              We automatically collect information about your interactions with our Service, including:
            </p>
            <ul>
              <li>Pages and features you use</li>
              <li>Time spent on the Service</li>
              <li>Prediction types you view</li>
              <li>Sports and leagues you follow</li>
              <li>Notification interactions</li>
              <li>Error logs and performance data</li>
            </ul>
            
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Process your subscription and payments</li>
              <li>Personalize your experience and deliver content relevant to your interests</li>
              <li>Send you notifications about predictions, accumulators, and relevant sports events</li>
              <li>Communicate with you about updates, promotions, and new features</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
            
            <h2>3. How We Share Your Information</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul>
              <li><strong>Service Providers:</strong> We share data with third-party vendors, consultants, and other service providers who need access to your information to perform services on our behalf (payment processors, cloud hosting providers, analytics services).</li>
              <li><strong>Business Transfers:</strong> If PuntaIQ is involved in a merger, acquisition, or sale of all or a portion of its assets, your information may be transferred as part of that transaction.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
            
            <h2>4. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you with our Service. We may also retain certain information for legal compliance, preventing fraud, and resolving disputes.
            </p>
            
            <h2>5. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul>
              <li>Access to your personal information</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>Deletion of your personal information</li>
              <li>Restriction of processing of your data</li>
              <li>Data portability</li>
              <li>Objection to processing of your information</li>
            </ul>
            <p>
              You can exercise these rights by accessing your account settings or contacting us at privacy@puntaiq.com.
            </p>
            
            <h2>6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize content. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our Service.
            </p>
            
            <h2>7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
            
            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country. We ensure appropriate safeguards are in place to protect your information when transferred internationally.
            </p>
            
            <h2>9. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
            
            <h2>10. Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our Service and updating the "Last Updated" date.
            </p>
            
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p>
              Email: privacy@puntaiq.com<br />
              Address: PuntaIQ Headquarters, 123 Tech Street, London, UK
            </p>
            
            <p className="text-sm text-muted-foreground mt-6">Last Updated: May 2, 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}