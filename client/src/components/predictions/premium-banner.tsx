import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CrownIcon } from "lucide-react";
import { Link } from "wouter";

const PremiumBanner = () => {
  const { user } = useAuth();
  
  // Don't show banner for premium users
  if (user?.subscriptionTier && user.subscriptionTier !== "free") {
    return null;
  }
  
  return (
    <div className="relative bg-primary rounded-lg mx-4 my-3 overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Unlock Elite Predictions</h3>
            <p className="text-sm text-white opacity-90 mb-3">Get access to all sports and 95%+ accuracy predictions</p>
            <Button 
              asChild
              variant="secondary" 
              className="bg-white text-primary font-bold py-2 px-4 rounded-full text-sm"
            >
              <Link to="/subscription">
                Upgrade Now
              </Link>
            </Button>
          </div>
          <div className="bg-white bg-opacity-20 h-16 w-16 rounded-full flex items-center justify-center">
            <CrownIcon className="text-yellow-300 h-8 w-8" />
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 left-0 bottom-0 opacity-20">
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white bg-opacity-20"></div>
        <div className="absolute -left-16 -bottom-8 w-32 h-32 rounded-full bg-white bg-opacity-10"></div>
      </div>
    </div>
  );
};

export default PremiumBanner;
