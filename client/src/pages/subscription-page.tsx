import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/layout/top-bar";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, XIcon, CrownIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  disabledFeatures?: string[];
  isPopular?: boolean;
  ctaColor?: string;
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Define subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: 9.99,
      features: [
        "Daily predictions (3 sports)",
        "Basic stats dashboard",
        "Standard notifications"
      ],
      disabledFeatures: [
        "Custom accumulators"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 19.99,
      features: [
        "Daily predictions (all sports)",
        "Advanced stats & filters",
        "Priority notifications",
        "Custom 2 & 5 accumulators"
      ],
      isPopular: true,
      ctaColor: "bg-accent"
    },
    {
      id: "elite",
      name: "Elite",
      price: 29.99,
      features: [
        "Premium AI predictions (95%+ accuracy)",
        "Full statistics dashboard",
        "Instant alerts for high-value bets",
        "Custom 2, 5 & 10 accumulators"
      ]
    }
  ];
  
  // Handle subscription update
  const updateSubscription = useMutation({
    mutationFn: async (tier: string) => {
      const res = await apiRequest("POST", "/api/subscription/update", { tier });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Subscription updated",
        description: `You're now subscribed to the ${selectedPlan} plan!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    // In a real app, this would navigate to payment flow
    // For this MVP, we'll just update the subscription instantly
    updateSubscription.mutate(planId);
  };
  
  // Check if user is already subscribed to this plan
  const isCurrentPlan = (planId: string) => {
    return user?.subscriptionTier === planId;
  };
  
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Mike Johnson",
      initial: "M",
      tier: "Pro Member",
      duration: "8 months",
      rating: 5,
      text: "The AI predictions have been incredible for my betting success. The custom accumulators feature is a game-changer, and I've seen a 30% increase in my returns since upgrading to Pro."
    },
    {
      id: 2,
      name: "Sarah Williams",
      initial: "S",
      tier: "Elite Member",
      duration: "3 months",
      rating: 5,
      text: "Worth every penny! The Elite plan gives me access to the highest accuracy predictions, and the statistical dashboard helps me make informed decisions. Love the instant alerts feature."
    }
  ];
  
  // FAQ data
  const faqs = [
    {
      question: "How accurate are the AI predictions?",
      answer: "Our AI system averages 68-75% accuracy for standard predictions, while premium predictions exceed 90% accuracy based on historical data analysis."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
    },
    {
      question: "How often are predictions updated?",
      answer: "Our AI engine refreshes predictions daily, with premium alerts for high-value opportunities sent in real-time as they're discovered."
    }
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="pt-4 px-4">
          <h2 className="text-lg font-bold text-foreground mb-1">Upgrade Your Experience</h2>
          <p className="text-muted-foreground mb-6">Get exclusive access to premium predictions and features</p>
          
          {/* Subscription plans */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  plan.isPopular ? 'border-2 border-primary transform scale-105 shadow-md' : 'border-border'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-bold text-center py-1">
                    MOST POPULAR
                  </div>
                )}
                
                <CardContent className={`p-5 ${plan.isPopular ? 'pt-8' : ''}`}>
                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/month</span>
                  </div>
                  
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-green-500 mt-1 mr-2" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                    
                    {plan.disabledFeatures?.map((feature) => (
                      <li key={feature} className="flex items-start opacity-50">
                        <XIcon className="h-4 w-4 text-red-500 mt-1 mr-2" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.ctaColor || 'bg-primary'}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan(plan.id) || updateSubscription.isPending}
                  >
                    {isCurrentPlan(plan.id) 
                      ? "Current Plan" 
                      : updateSubscription.isPending && selectedPlan === plan.id
                        ? "Upgrading..."
                        : "Select Plan"
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Testimonials */}
          <h3 className="text-md font-bold text-foreground mb-4">What Our Users Say</h3>
          <div className="grid grid-cols-1 gap-4 mb-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <div className={`h-10 w-10 rounded-full ${
                      testimonial.tier.includes("Pro") ? 'bg-primary' : 'bg-accent'
                    } flex items-center justify-center text-white font-bold`}>
                      {testimonial.initial}
                    </div>
                    <div className="ml-3">
                      <div className="text-foreground font-medium">{testimonial.name}</div>
                      <div className="text-muted-foreground text-xs">{testimonial.tier} • {testimonial.duration}</div>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* FAQ Section */}
          <h3 className="text-md font-bold text-foreground mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3 mb-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-card">
                <CardContent className="p-4">
                  <h4 className="text-foreground font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <BottomNavigation activePage="subscription" />
    </div>
  );
}
