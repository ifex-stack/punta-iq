import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  Shield, 
  HeartHandshake, 
  GraduationCap, 
  Trophy, 
  Dices, 
  Shirt,
  Snowflake,
  Flag,
  Atom,
  Dribbble,
  Swords,
  LucideIcon,
  Gauge,
  BarChart4,
  Sparkles,
  Zap
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FooterLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function MobileFooter() {
  const [_, navigate] = useLocation();
  
  // Sports section
  const sportsLinks: FooterLink[] = [
    { name: "Football", href: "/?sport=football", icon: Trophy },
    { name: "Basketball", href: "/?sport=basketball", icon: Dribbble },
    { name: "Tennis", href: "/?sport=tennis", icon: Dices },
    { name: "Volleyball", href: "/?sport=volleyball", icon: Shirt },
    { name: "Hockey", href: "/?sport=hockey", icon: Snowflake },
    { name: "Rugby", href: "/?sport=rugby", icon: Flag },
    { name: "Baseball", href: "/?sport=baseball", icon: Atom },
    { name: "Cricket", href: "/?sport=cricket", icon: GraduationCap },
    { name: "MMA", href: "/?sport=mma", icon: Swords },
  ];
  
  // Enhanced features section
  const featuresLinks: FooterLink[] = [
    { name: "Confidence Meter", href: "/confidence-meter-demo", icon: Gauge },
    { name: "AI Accumulators", href: "/ai-accumulators", icon: Sparkles },
    { name: "Advanced Stats", href: "/advanced-analysis-page", icon: BarChart4 },
    { name: "Predictions", href: "/", icon: Zap },
  ];
  
  // Legal section
  const legalLinks: FooterLink[] = [
    { name: "Privacy Policy", href: "/legal/privacy-policy", icon: Shield },
    { name: "Terms of Service", href: "/legal/terms-of-service", icon: Info },
    { name: "Responsible Gambling", href: "/legal/responsible-gambling", icon: AlertTriangle },
    { name: "Support", href: "/faq", icon: HeartHandshake },
  ];
  
  return (
    <motion.footer 
      className="px-4 py-6 mt-4 bg-muted/30 border-t border-primary/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Sports Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">Powerful AI Predictions</h3>
            <ul className="grid grid-cols-2 gap-2">
              {sportsLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center w-full transition-colors"
                  >
                    <link.icon size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{link.name}</span>
                    <ChevronRight size={12} className="ml-auto flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Features Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Enhanced Features
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {featuresLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center w-full transition-colors group"
                  >
                    <link.icon size={12} className="mr-1 flex-shrink-0 text-primary/70 group-hover:text-primary" />
                    <span className="truncate">{link.name}</span>
                    <ChevronRight size={12} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Legal Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">Legal</h3>
            <ul className="grid grid-cols-2 gap-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center w-full transition-colors"
                  >
                    <link.icon size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{link.name}</span>
                    <ChevronRight size={12} className="ml-auto flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <Separator className="my-5" />
        
        <div className="text-xs text-center text-muted-foreground">
          <p>PuntaIQ © {new Date().getFullYear()}. All rights reserved.</p>
          <p className="mt-1 text-[10px]">
            Version 2.0.5 | AI-powered Sports Prediction Platform
          </p>
        </div>
      </div>
    </motion.footer>
  );
}