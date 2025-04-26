import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Search, Mail, ArrowRight, X } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // FAQ data
  const faqItems: FAQItem[] = [
    // Account & Subscription
    {
      id: "account-1",
      question: "How do I create a PuntaIQ account?",
      answer: "You can create a PuntaIQ account by clicking the Sign Up button on our homepage or going to the Auth page. Fill in your email, username, and password to get started. After verifying your email, you'll have access to our free tier predictions.",
      category: "account"
    },
    {
      id: "account-2",
      question: "What subscription plans does PuntaIQ offer?",
      answer: "PuntaIQ offers three subscription tiers: Basic (access to 1 sport and daily predictions), Pro (access to all sports and accumulator tips), and Elite (full access to all predictions, accumulators, and historical data).",
      category: "account"
    },
    {
      id: "account-3",
      question: "How do I upgrade my subscription?",
      answer: "You can upgrade your subscription from your Profile page. Click on your profile icon, select the Subscription tab, and choose the plan that best suits your needs. All payments are securely processed through Stripe.",
      category: "account"
    },
    {
      id: "account-4",
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time from your Profile page under the Subscription tab. Your subscription will remain active until the end of your current billing period.",
      category: "account"
    },
    
    // Predictions
    {
      id: "predictions-1",
      question: "How does PuntaIQ generate predictions?",
      answer: "PuntaIQ uses an advanced prediction system that analyzes thousands of data points including team statistics, player performance, historical matchups, venue information, and many other factors. Our system is continuously updated with the latest data to ensure maximum accuracy.",
      category: "predictions"
    },
    {
      id: "predictions-2",
      question: "Which sports does PuntaIQ cover?",
      answer: "PuntaIQ provides predictions for football (soccer), basketball, tennis, baseball, and hockey. We plan to add more sports in the future based on user demand.",
      category: "predictions"
    },
    {
      id: "predictions-3",
      question: "How often are new predictions added?",
      answer: "New predictions are generated automatically every day. Our system analyzes upcoming matches and publishes predictions approximately 24-48 hours before each event starts.",
      category: "predictions"
    },
    {
      id: "predictions-4",
      question: "What types of bets does PuntaIQ predict?",
      answer: "PuntaIQ provides predictions for various markets including match outcomes (1X2), over/under goals/points, both teams to score (BTTS), handicaps, and correct scores. We also generate accumulators with different odds ranges (15, 20, 30, and 50).",
      category: "predictions"
    },
    {
      id: "predictions-5",
      question: "What is the success rate of PuntaIQ predictions?",
      answer: "Our overall success rate across all sports is approximately 68.4%, with football predictions having the highest accuracy at around 72.1%. You can view detailed statistics on our Stats page which is updated in real-time as results come in.",
      category: "predictions"
    },
    
    // Accumulators
    {
      id: "accumulators-1",
      question: "What are accumulators in PuntaIQ?",
      answer: "Accumulators (also known as parlays) are multiple selections combined into a single bet. PuntaIQ automatically generates accumulator bets with various odds ranges (15, 20, 30, and 50) by combining our highest confidence predictions across different sports and leagues.",
      category: "accumulators"
    },
    {
      id: "accumulators-2",
      question: "How are accumulators created in PuntaIQ?",
      answer: "Our system analyzes all available predictions and selects the ones with the highest confidence rating. These selections are then combined to create accumulators with target odds. The system ensures that only compatible matches are included and optimizes for the best chance of success.",
      category: "accumulators"
    },
    {
      id: "accumulators-3",
      question: "Can I create my own accumulators?",
      answer: "Elite tier subscribers can create custom accumulators by selecting individual predictions from our platform. This feature allows you to combine your own insights with our expert recommendations.",
      category: "accumulators"
    },
    
    // App & Features
    {
      id: "app-1", 
      question: "Is there a mobile app for PuntaIQ?",
      answer: "Yes, PuntaIQ is available as a mobile app for both iOS and Android devices. You can download it from the Apple App Store or Google Play Store. The mobile app offers the same features as the web version with a mobile-optimized interface.",
      category: "app"
    },
    {
      id: "app-2",
      question: "What is the Historical Dashboard?",
      answer: "The Historical Dashboard is a feature that allows you to view and analyze past predictions and their outcomes. You can filter by sport, date range, prediction type, and more. This tool is valuable for understanding performance trends and identifying valuable betting patterns.",
      category: "app"
    },
    {
      id: "app-3",
      question: "How do I get help if I have a question?",
      answer: "You can get help through our AI assistant chat feature, which is available on every page. For more complex issues, you can contact our support team at support@puntaiq.com. We aim to respond to all inquiries within 24 hours.",
      category: "app"
    },
    
    // Technical
    {
      id: "technical-1",
      question: "How do I enable notifications for new predictions?",
      answer: "You can enable notifications in your Profile settings. We offer notifications for new predictions, match starts, and prediction results. You can customize which notifications you receive and how you receive them (app, email, or both).",
      category: "technical"
    },
    {
      id: "technical-2",
      question: "Is my payment information secure?",
      answer: "Yes, all payment processing is handled securely through Stripe, one of the world's leading payment processors. PuntaIQ does not store your full credit card details on our servers.",
      category: "technical"
    },
    {
      id: "technical-3",
      question: "Can I use PuntaIQ internationally?",
      answer: "Yes, PuntaIQ is available worldwide. We provide coverage for major leagues and tournaments across the globe. Our platform automatically adjusts to your time zone to show match times correctly.",
      category: "technical"
    },
  ];
  
  // Filter FAQ items based on search
  const filteredFAQs = searchQuery.trim() === "" 
    ? faqItems 
    : faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  // Group FAQ items by category
  const groupedFAQs = filteredFAQs.reduce<Record<string, FAQItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  
  // Category titles
  const categoryTitles: Record<string, string> = {
    account: "Account & Subscription",
    predictions: "Predictions",
    accumulators: "Accumulators",
    app: "App & Features",
    technical: "Technical"
  };

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              className="pl-10 pr-10" 
              placeholder="Search for questions or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full aspect-square rounded-l-none"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No results found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any FAQ that matches your search query.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4">{categoryTitles[category]}</h2>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="text-muted-foreground">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
      
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Still have questions?</CardTitle>
          <CardDescription>
            If you cannot find the answer to your question in our FAQ, you can contact our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Email Support</h3>
                <p className="text-muted-foreground mb-4">
                  Our support team is available 24/7 to help you with any questions.
                </p>
                <Button className="mt-auto">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquareIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">AI Assistant</h3>
                <p className="text-muted-foreground mb-4">
                  Use our AI assistant to get immediate answers to common questions.
                </p>
                <Button variant="outline" className="mt-auto">
                  Chat with Assistant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

// Import MessageSquare icon
const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);