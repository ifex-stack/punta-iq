import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, Shield } from "lucide-react";
import { GamblingControls } from "@/components/responsible-gambling/gambling-controls";

export default function ResponsibleGamblingPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      <Card className="mb-8">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6 text-primary" />
            Responsible Gambling
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none p-6">
          <h2>Our Commitment to Responsible Gambling</h2>
          <p>
            At PuntaIQ, we are committed to promoting responsible gambling. We believe that using our sports prediction services should always be an entertaining and positive experience, not a source of financial or emotional distress.
          </p>

          <h2>Understanding Responsible Gambling</h2>
          <p>
            Responsible gambling means:
          </p>
          <ul>
            <li>Viewing gambling as entertainment, not as a way to make money</li>
            <li>Only gambling with money you can afford to lose</li>
            <li>Setting time and money limits and sticking to them</li>
            <li>Never chasing losses or borrowing money to gamble</li>
            <li>Not gambling when feeling upset, angry, or depressed</li>
            <li>Balancing gambling with other activities</li>
          </ul>

          <h2>Signs of Problem Gambling</h2>
          <p>
            Problem gambling can affect anyone. If you notice any of these warning signs, it may be time to reconsider your gambling habits:
          </p>
          <ul>
            <li>Spending more time or money on gambling than planned</li>
            <li>Difficulty controlling or stopping gambling</li>
            <li>Neglecting work, family, or other responsibilities due to gambling</li>
            <li>Lying to others about how much you gamble</li>
            <li>Chasing losses or borrowing money to gamble</li>
            <li>Feeling anxious, irritable, or restless when not gambling</li>
            <li>Gambling to escape problems or relieve negative emotions</li>
          </ul>

          <h2>Our Responsible Gambling Tools</h2>
          <p>
            We provide several tools to help you maintain control over your gambling:
          </p>
          <ul>
            <li><strong>Time-outs (Cool-off periods):</strong> Take a short break from your account for 24 hours to 30 days</li>
            <li><strong>Self-exclusion:</strong> Block access to your account for a longer period (6 months to permanently)</li>
            <li><strong>Account closure:</strong> Permanently close your account</li>
          </ul>

          <h2>Support and Resources</h2>
          <p>
            If you or someone you know is struggling with gambling problems, help is available:
          </p>
          <ul>
            <li><a href="https://www.begambleaware.org/" target="_blank" rel="noopener noreferrer" className="text-primary">BeGambleAware</a> - 0808 8020 133</li>
            <li><a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="text-primary">GamCare</a> - 0808 8020 133</li>
            <li><a href="https://www.gamblingtherapy.org/" target="_blank" rel="noopener noreferrer" className="text-primary">Gambling Therapy</a> - Global support</li>
            <li><a href="https://www.gamblersanonymous.org.uk/" target="_blank" rel="noopener noreferrer" className="text-primary">Gamblers Anonymous UK</a></li>
          </ul>

          <div className="bg-muted p-4 rounded-md mt-8">
            <h3 className="text-lg font-medium">Protection of Minors</h3>
            <p>
              PuntaIQ is strictly for users 18 years of age or older. We implement strict age verification processes and encourage parents and guardians to install parental control software to prevent minors from accessing gambling-related content.
            </p>
          </div>
        </CardContent>
      </Card>

      <GamblingControls />
    </div>
  );
}