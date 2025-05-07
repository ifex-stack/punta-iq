import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, AlertTriangle, Phone, Link, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

export default function ResponsibleGamblingPage() {
  const [_, navigate] = useLocation();
  
  const resourceLinks = [
    {
      name: "GamCare",
      description: "Support and resources for anyone affected by problem gambling.",
      url: "https://www.gamcare.org.uk/",
      phone: "0808 8020 133",
    },
    {
      name: "BeGambleAware",
      description: "Free advice, information and support for gambling problems.",
      url: "https://www.begambleaware.org/",
      phone: "0808 8020 133",
    },
    {
      name: "Gamblers Anonymous",
      description: "A fellowship of men and women who share their experience and strength to solve their common problem.",
      url: "https://www.gamblersanonymous.org.uk/",
    },
    {
      name: "National Gambling Helpline",
      description: "Free, confidential support for anyone affected by gambling problems.",
      phone: "0808 8020 133",
    },
  ];
  
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <h1 className="text-3xl font-bold mb-6">Responsible Gambling</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-medium mb-1">Important Notice</h3>
                  <p className="text-sm leading-relaxed">
                    PuntaIQ is a prediction service only, not a gambling platform. We do not accept bets 
                    or provide gambling services. The information below is provided for educational purposes 
                    and for those who may use our predictions for gambling elsewhere.
                  </p>
                </div>
              </div>
              
              <p className="lead">
                At PuntaIQ, we are committed to promoting responsible gambling practices. 
                While we do not offer gambling services directly, we recognize that our predictions 
                may be used to inform betting decisions.
              </p>
              
              <h2>Gambling Guidelines</h2>
              <p>
                If you choose to use our predictions for gambling purposes, we encourage you to follow these guidelines:
              </p>
              <ul>
                <li>Set a budget before you start and never exceed it</li>
                <li>View gambling as entertainment, not as a source of income</li>
                <li>Only gamble with money you can afford to lose</li>
                <li>Never chase losses as this can lead to larger losses</li>
                <li>Take regular breaks and maintain a balance with other activities</li>
                <li>Don't gamble when feeling depressed, upset, or under the influence of alcohol/drugs</li>
                <li>Keep track of the time and money you spend</li>
              </ul>
              
              <h2>Signs of Problem Gambling</h2>
              <p>
                Be aware of these warning signs that gambling might be becoming a problem:
              </p>
              <ul>
                <li>Gambling with money needed for essential expenses</li>
                <li>Borrowing money or selling possessions to fund gambling</li>
                <li>Neglecting work, education, or family commitments due to gambling</li>
                <li>Feeling restless or irritable when not gambling</li>
                <li>Gambling to escape problems or relieve feelings of helplessness, anxiety, or depression</li>
                <li>Lying to family members or friends to hide gambling activities</li>
                <li>Continuing to gamble despite negative consequences</li>
              </ul>
              
              <h2>Self-Assessment</h2>
              <p>
                If you're concerned about your gambling habits, ask yourself the following questions:
              </p>
              <ul>
                <li>Do I gamble to escape problems or to feel better when I'm depressed?</li>
                <li>Have I missed work, school, or important social activities due to gambling?</li>
                <li>Do I continue gambling after losing money, hoping to win it back?</li>
                <li>Have I lied about my gambling habits to family or friends?</li>
                <li>Have I risked or lost important relationships, jobs, or opportunities due to gambling?</li>
                <li>Have I asked others to bail me out of financial difficulties caused by gambling?</li>
              </ul>
              <p>
                If you've answered "yes" to any of these questions, we encourage you to speak with a professional.
              </p>
              
              <h2>Support Resources</h2>
              <p>
                If you or someone you know is struggling with gambling issues, these organizations can help:
              </p>
              
              <div className="grid gap-4 md:grid-cols-2 my-6">
                {resourceLinks.map((resource) => (
                  <motion.div
                    key={resource.name}
                    className="border border-border rounded-lg p-4"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4" /> 
                      {resource.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      {resource.description}
                    </p>
                    <div className="flex flex-col gap-2">
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700"
                        >
                          <Link className="h-3 w-3" />
                          {resource.url}
                        </a>
                      )}
                      {resource.phone && (
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {resource.phone}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <h2>Our Commitment</h2>
              <p>
                PuntaIQ is committed to promoting responsible approach to sports predictions and betting.
                Our platform is designed to provide accurate, data-driven predictions, but we strongly
                encourage our users to use this information responsibly. Remember that no prediction
                service can guarantee results, and all gambling activities carry risks.
              </p>
              
              <h2>Contact Us</h2>
              <p>
                If you have any questions or concerns about responsible gambling or our services, 
                please contact us at: <a href="mailto:support@puntaiq.com">support@puntaiq.com</a>
              </p>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-muted-foreground">Last Updated: May 7, 2025</p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}