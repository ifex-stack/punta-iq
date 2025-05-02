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
              We do not guarantee successful outcomes or any return on investments.
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
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Consider setting time limits for your gambling activities.</span>
              </li>
              <li className="flex gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Never gamble when feeling depressed, upset, or under the influence.</span>
              </li>
            </ul>
          </div>
          
          <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-medium mb-2">Signs of Problem Gambling</h4>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Gambling with more money than you can afford to lose</li>
              <li>Borrowing money or selling possessions to fund gambling</li>
              <li>Lying to friends and family about gambling habits</li>
              <li>Feeling anxious, guilty, or irritable when trying to stop</li>
              <li>Neglecting work, education, or family responsibilities</li>
              <li>Gambling to escape problems or relieve feelings of helplessness</li>
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
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">National Council on Problem Gambling (US)</span>
                <span>1-800-522-4700</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-md">
                <span className="font-medium">Gambling Help Online (Australia)</span>
                <span>1800 858 858</span>
              </div>
            </div>
          </div>
          
          <Alert variant="destructive" className="bg-opacity-10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Financial Risk Warning</AlertTitle>
            <AlertDescription className="text-sm">
              Past performance does not guarantee future results. Sports betting involves substantial risk of financial loss. 
              Never invest money you cannot afford to lose, and never chase losses with larger bets. Our predictions are 
              informational and never constitute financial advice.
            </AlertDescription>
          </Alert>
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
                <span>Age verification requirements (18+ in most jurisdictions, 21+ in some US states)</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Data protection and privacy laws including GDPR in Europe</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Advertising standards for gambling-related content in all operating territories</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Responsible gambling promotion with clear risk warnings</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Fair and transparent information about odds, predictions and success rates</span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Ethical marketing practices that do not target vulnerable individuals</span>
              </li>
            </ul>
          </div>
          
          <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900/50 my-4">
            <h4 className="font-medium mb-2">Your Responsibility as a User</h4>
            <ul className="space-y-1 text-sm">
              <li>Verify that betting is legal in your location before placing bets based on our predictions</li>
              <li>Understand that our AI predictions are probability-based and cannot guarantee outcomes</li>
              <li>Use our services only if you meet the minimum legal age requirement in your jurisdiction</li>
              <li>Follow responsible gambling practices, including setting strict betting limits</li>
              <li>Never use betting as a financial solution or means to generate necessary income</li>
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
                take bets, or act as a bookmaker. Our predictions contain inherent uncertainties and should be used 
                as one of many resources when making betting decisions. Users are responsible for ensuring their compliance 
                with local gambling laws and regulations. PuntaIQ assumes no liability for any financial losses 
                incurred from the use of our prediction services.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="mt-4">
            <Alert variant="default" className="bg-slate-100 dark:bg-slate-900/50">
              <AlertTitle className="text-sm font-medium">Terms & Conditions Apply</AlertTitle>
              <AlertDescription className="text-xs">
                By using PuntaIQ, you acknowledge that you have read and understood our Terms of Service, 
                Privacy Policy, and this Gambling Regulations document. Please review these documents regularly
                as they may be updated from time to time.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
        
        <TabsContent value="region" className="space-y-4 pt-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Regional Policies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gambling regulations vary by region. Please be aware of the laws in your jurisdiction before using our predictions for betting purposes.
            </p>
            
            <div className="space-y-3">
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>United Kingdom</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the UK Gambling Commission. Users must be 18+. Self-exclusion options available through GAMSTOP. 
                  Licensed operators must adhere to strict responsible gambling requirements including deposit limits, time limits, and self-exclusion tools.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>European Union</Badge>
                </h4>
                <p className="text-sm">
                  Regulations vary by country. Most EU countries require users to be 18+ with mandatory responsible gambling tools.
                  Some countries (France, Spain, Italy) operate with a licensed market model, while others have specific restrictions on betting types.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>Nigeria</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the National Lottery Regulatory Commission. Users must be 18+. Online sports betting is legal with proper licensing.
                  Nigerian regulations require operators to implement responsible gambling measures and obtain local licensing.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>United States</Badge>
                </h4>
                <p className="text-sm">
                  Regulated at the state level. Legal status varies widely by state - some allow fully regulated online sports betting,
                  others permit only retail betting, and some prohibit sports betting entirely. All legal states require bettors to be 21+
                  and physically located within state borders when placing bets.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>Kenya</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the Betting Control and Licensing Board. Legal age for betting is 18+. Online sports betting is permitted with proper licensing.
                  Recent regulatory changes have focused on taxation and responsible gambling measures.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>Ghana</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by the Gaming Commission of Ghana. Legal age is 18+. Sports betting is legal with proper licensing.
                  Operators must implement responsible gambling measures and age verification procedures.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>South Africa</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by provincial gambling boards under the National Gambling Act. Legal age is 18+.
                  Online sports betting is legal only through licensed operators, with each province managing its own licensing.
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Badge>Australia</Badge>
                </h4>
                <p className="text-sm">
                  Regulated by state and territory gambling authorities. Legal age is 18+. Online betting is legal only through 
                  Australian-licensed bookmakers, with in-play betting restricted to telephone and retail channels.
                </p>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Legal Notice</AlertTitle>
            <AlertDescription className="text-sm">
              Users are responsible for knowing and complying with local laws. If online gambling or sports betting is 
              illegal in your jurisdiction, our prediction services are for entertainment purposes only. This information
              is provided as general guidance and is not legal advice. Regulations change frequently, so please verify
              current laws in your location.
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