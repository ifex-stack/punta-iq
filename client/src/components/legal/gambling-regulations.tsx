import { useState } from "react";
import { AlertCircle, Info, Shield } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GamblingRegulationsLink() {
  return (
    <DialogTrigger asChild>
      <button className="text-xs underline text-muted-foreground hover:text-primary">
        Gambling Regulations
      </button>
    </DialogTrigger>
  );
}

export function GamblingRegulationsFooter() {
  return (
    <div className="mt-8 pt-4 border-t text-center">
      <p className="text-xs text-muted-foreground mb-2">
        PuntaIQ adheres to responsible gambling regulations. Please gamble responsibly.
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs py-0 h-5">18+</Badge>
        <Badge variant="outline" className="text-xs py-0 h-5">T&Cs Apply</Badge>
        <Dialog>
          <GamblingRegulationsLink />
          <GamblingRegulationsDialog />
        </Dialog>
      </div>
    </div>
  );
}

export function GamblingRegulationsDialog() {
  const [activeTab, setActiveTab] = useState("responsibility");

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Gambling Regulations and Responsible Gambling
        </DialogTitle>
        <DialogDescription>
          Important information about gambling regulations and responsible gambling
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="responsibility">Responsible Gambling</TabsTrigger>
          <TabsTrigger value="regulations">Regulations</TabsTrigger>
          <TabsTrigger value="region">Regional Policies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="responsibility" className="space-y-4 pt-4">
          <Alert variant="default" className="bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription className="text-sm">
              PuntaIQ provides predictions as entertainment and informational resources only. 
              We encourage responsible gambling and urge users to gamble within their means.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Responsible Gambling Guidelines</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Only bet what you can afford to lose. Set a budget and stick to it.</span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Don't chase losses - it's easy to get caught in a cycle trying to recover losses.</span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Take breaks and don't let gambling interfere with your daily life or responsibilities.</span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Be aware of the signs of gambling addiction and seek help if needed.</span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Remember that betting should be for entertainment, not as a source of income.</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Help Resources</h3>
            <p className="text-sm text-muted-foreground">
              If you or someone you know may have a gambling problem, there are resources available:
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">GamCare (UK)</span>
                <span>0808 8020 133</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">National Gambling Helpline (UK)</span>
                <span>0808 8020 133</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">BeGambleAware</span>
                <span>www.begambleaware.org</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">Gambling Therapy</span>
                <span>www.gamblingtherapy.org</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="regulations" className="space-y-4 pt-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Regulatory Compliance</h3>
            <p className="text-sm text-muted-foreground">
              PuntaIQ operates in compliance with gambling regulations in the jurisdictions where our services are available. We adhere to:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Age verification requirements (18+ in most jurisdictions)</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Data protection and privacy laws</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Advertising standards for gambling-related content</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Responsible gambling promotion</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Fair and transparent information about odds and predictions</span>
              </li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Important Legal Disclaimer</h3>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Legal Notice</AlertTitle>
              <AlertDescription className="text-sm">
                PuntaIQ provides predictions as informational content only. We do not operate gambling services,
                take bets, or act as a bookmaker. Our service should be used as one of many resources when making
                betting decisions. Users are responsible for ensuring their compliance with local gambling laws and regulations.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
        
        <TabsContent value="region" className="space-y-4 pt-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Regional Policies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gambling regulations vary by region. Please be aware of the laws in your jurisdiction.
            </p>
            
            <div className="space-y-3">
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>United Kingdom</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the UK Gambling Commission. Users must be 18+. Self-exclusion options available through GAMSTOP.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>European Union</Badge>
                </h4>
                <p className="text-sm">
                  Regulations vary by country. Most require users to be 18+ and provide self-exclusion options.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>Nigeria</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the National Lottery Regulatory Commission. Users must be 18+.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>United States</Badge>
                </h4>
                <p className="text-sm">
                  Regulations vary by state. Users should check local laws as some states prohibit or restrict online gambling.
                </p>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-sm">
              Users are responsible for knowing and complying with local laws. If online gambling or sports betting is 
              illegal in your jurisdiction, our prediction services are for entertainment purposes only.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="flex flex-col md:flex-row gap-2 mt-4">
        <div className="flex-1 text-xs text-muted-foreground">
          Last updated: May 2, 2025
        </div>
        <Button type="submit" size="sm">
          I Understand
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}