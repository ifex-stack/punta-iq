import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsConditionsPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6 text-primary" />
            Terms and Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none p-6">
          <p className="text-sm text-muted-foreground">
            Last Updated: April 27, 2025
          </p>

          <div className="mt-6">
            <h2>1. Introduction</h2>
            <p>
              Welcome to PuntaIQ. These Terms and Conditions govern your use of our sports prediction application and related services. By accessing or using our services, you agree to be bound by these terms.
            </p>

            <h2>2. Definitions</h2>
            <p>
              In these Terms and Conditions:
            </p>
            <ul>
              <li>"PuntaIQ," "we," "us," or "our" refers to the operator of the PuntaIQ application and services</li>
              <li>"User," "you," or "your" refers to any individual who accesses or uses our services</li>
              <li>"Services" refers to our sports prediction application, website, and related offerings</li>
              <li>"Content" refers to predictions, analyses, statistics, and other information provided through our services</li>
              <li>"Subscription" refers to the paid access to premium features of our services</li>
            </ul>

            <h2>3. Use of Services</h2>
            <h3>3.1 Eligibility</h3>
            <p>
              You must be at least 18 years old to use our services. By using our services, you represent and warrant that you meet this requirement.
            </p>

            <h3>3.2 Account Creation</h3>
            <p>
              To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3>3.3 Acceptable Use</h3>
            <p>
              You agree to use our services only for lawful purposes and in accordance with these Terms. You must not:
            </p>
            <ul>
              <li>Use our services in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any part of our services</li>
              <li>Use our services to engage in fraudulent or deceptive activities</li>
              <li>Interfere with the proper functioning of our services</li>
              <li>Use automated means to access or manipulate our services</li>
              <li>Share your account credentials with third parties</li>
            </ul>

            <h2>4. Subscriptions and Payments</h2>
            <h3>4.1 Subscription Plans</h3>
            <p>
              We offer various subscription plans with different features and pricing. Details of available plans are provided on our application and website.
            </p>

            <h3>4.2 Payment Terms</h3>
            <p>
              By subscribing to our premium services, you agree to pay the applicable fees. Payments are processed through secure third-party payment processors.
            </p>

            <h3>4.3 Automatic Renewal</h3>
            <p>
              Subscriptions automatically renew at the end of each billing period unless cancelled. You can cancel your subscription at any time through your account settings.
            </p>

            <h3>4.4 Refund Policy</h3>
            <p>
              Refunds are provided in accordance with our refund policy, which may vary by subscription type and jurisdiction.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our services, including but not limited to text, graphics, logos, and software, are owned by PuntaIQ or our licensors and are protected by intellectual property laws.
            </p>

            <h2>6. Content and Predictions</h2>
            <h3>6.1 No Guarantee of Accuracy</h3>
            <p>
              Our predictions and analyses are provided for informational and entertainment purposes only. We make no guarantees regarding the accuracy, completeness, or reliability of any predictions or content.
            </p>

            <h3>6.2 Not Financial or Gambling Advice</h3>
            <p>
              Our content does not constitute financial or gambling advice. Any decisions you make based on our predictions are at your own risk and discretion.
            </p>

            <h2>7. Responsible Gambling</h2>
            <p>
              We promote responsible gambling and provide tools to help users control their gambling activities. Users are encouraged to:
            </p>
            <ul>
              <li>Set personal limits on gambling activities</li>
              <li>Take advantage of self-exclusion and time-out options</li>
              <li>Seek help if gambling becomes problematic</li>
            </ul>

            <h2>8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, PuntaIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or relating to your use of our services.
            </p>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless PuntaIQ, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses arising from your use of our services or violation of these Terms.
            </p>

            <h2>10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to our services at any time for violations of these Terms or for any other reason at our discretion.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify users of significant changes. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
            </p>

            <h2>12. Privacy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law principles.
            </p>

            <h2>14. Dispute Resolution</h2>
            <p>
              Any disputes arising from or relating to these Terms shall be resolved through arbitration in accordance with the rules of the International Chamber of Commerce.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              If you have questions or concerns about these Terms, please contact us at:
            </p>
            <p>
              Email: legal@puntaiq.com<br />
              Address: 123 Tech Avenue, London, UK
            </p>

            <div className="bg-muted p-4 rounded-md mt-8">
              <h3 className="text-lg font-medium">Regulatory Compliance</h3>
              <p>
                PuntaIQ complies with all applicable gambling regulations in the jurisdictions where our services are offered. Our services may be subject to additional terms and requirements imposed by local gambling authorities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}