import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <Shield className="h-6 w-6 text-primary" />
            Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none p-6">
          <p className="text-sm text-muted-foreground">
            Last Updated: April 27, 2025
          </p>

          <div className="mt-6">
            <h2>Introduction</h2>
            <p>
              PuntaIQ ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your personal information when you use our sports prediction application and related services.
            </p>

            <h2>Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and login credentials</li>
              <li><strong>Device Information:</strong> Device identifiers, IMEI, IP address, browser type, and operating system</li>
              <li><strong>Usage Data:</strong> Information about how you use our application, including predictions viewed, betting patterns, and feature usage</li>
              <li><strong>Location Data:</strong> General location information based on IP address for service optimization</li>
              <li><strong>Financial Information:</strong> Limited payment information for subscription processing through our secured payment processors</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To personalize your experience and offer tailored content</li>
              <li>To analyze usage patterns and improve our services</li>
              <li>To comply with regulatory requirements and prevent fraud</li>
              <li>To communicate with you about service updates, new features, and promotional offers</li>
            </ul>

            <h2>Legal Basis for Processing</h2>
            <p>We process your personal data based on:</p>
            <ul>
              <li>Your consent</li>
              <li>The necessity to perform our contract with you</li>
              <li>Compliance with legal obligations</li>
              <li>Our legitimate interests in providing and improving our services</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Service providers who help us operate our business</li>
              <li>Payment processors for subscription management</li>
              <li>Analytics providers who help us understand app usage</li>
              <li>Law enforcement or regulatory authorities when legally required</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include data encryption, access controls, and secure server infrastructure.
            </p>

            <h2>Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy or as required by law. When your data is no longer required, we will securely delete or anonymize it.
            </p>

            <h2>Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li>Access to personal information we hold about you</li>
              <li>Correction of inaccurate or incomplete data</li>
              <li>Deletion of your personal information</li>
              <li>Restriction or objection to certain processing activities</li>
              <li>Data portability</li>
              <li>Withdrawal of consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided at the end of this policy.
            </p>

            <h2>International Transfers</h2>
            <p>
              Your information may be transferred and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data when transferred internationally, in compliance with applicable data protection laws.
            </p>

            <h2>Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookie settings through your browser preferences.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we discover that we have collected personal information from a child, we will delete it promptly.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy periodically. We will notify you of significant changes by posting the updated policy on our application or by other appropriate means.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions or concerns about this privacy policy or our data practices, please contact us at:
            </p>
            <p>
              Email: privacy@puntaiq.com<br />
              Address: 123 Tech Avenue, London, UK
            </p>

            <div className="bg-muted p-4 rounded-md mt-8">
              <h3 className="text-lg font-medium">Gambling Regulatory Compliance</h3>
              <p>
                As a provider of sports prediction services that may be used for gambling purposes, we comply with all applicable gambling regulations and are committed to promoting responsible gambling. We collect and process certain data as required by gambling regulatory authorities in the UK and other jurisdictions where our services are offered.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}