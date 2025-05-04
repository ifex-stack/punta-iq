import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Info, Layout, Check } from "lucide-react";

export default function RoutingTestPage() {
  // Get current URL and host information
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;
  const port = window.location.port;
  const pathname = window.location.pathname;
  
  return (
    <div className="container py-8 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Routing Test Page</CardTitle>
          <CardDescription>Use this page to test all application routes and verify static file routing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Current Location Info</AlertTitle>
            <AlertDescription className="text-xs font-mono mt-2">
              <div><strong>Full URL:</strong> {currentUrl}</div>
              <div><strong>Hostname:</strong> {hostname}</div>
              <div><strong>Port:</strong> {port}</div>
              <div><strong>Path:</strong> {pathname}</div>
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Main Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <Link href="/">
                      <Layout className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <Link href="/predictions">
                      <Layout className="mr-2 h-4 w-4" />
                      Predictions
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <Link href="/livescore">
                      <Layout className="mr-2 h-4 w-4" />
                      LiveScore
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <Link href="/profile">
                      <Layout className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <Link href="/auth">
                      <Layout className="mr-2 h-4 w-4" />
                      Auth
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <a href="/api/status" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      API Status
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <a href="/debug/info" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Debug Info
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <a href="/api/debug/info" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Legacy Debug Info
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="justify-start">
                    <a href="/api/predictions/football" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Football Predictions
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Feature Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/predictions/advanced">
                    <Check className="mr-2 h-4 w-4" />
                    Advanced Predictions
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/accumulators">
                    <Check className="mr-2 h-4 w-4" />
                    Accumulators
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/subscription">
                    <Check className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/ai-service-status">
                    <Check className="mr-2 h-4 w-4" />
                    AI Service Status
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/fantasy">
                    <Check className="mr-2 h-4 w-4" />
                    Fantasy
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/referrals">
                    <Check className="mr-2 h-4 w-4" />
                    Referrals
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/gamification">
                    <Check className="mr-2 h-4 w-4" />
                    Gamification
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/faq">
                    <Check className="mr-2 h-4 w-4" />
                    FAQ
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/feedback">
                    <Check className="mr-2 h-4 w-4" />
                    Feedback
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/analytics-dashboard">
                    <Check className="mr-2 h-4 w-4" />
                    Analytics
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/legal/privacy-policy">
                    <Check className="mr-2 h-4 w-4" />
                    Privacy Policy
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/ui-showcase">
                    <Check className="mr-2 h-4 w-4" />
                    UI Showcase
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Edge Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/not-found">
                    <Info className="mr-2 h-4 w-4" />
                    Not Found Page
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/this-route-does-not-exist">
                    <Info className="mr-2 h-4 w-4" />
                    Invalid Route
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <a href="http://localhost:3000/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Port 3000 Direct
                  </a>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <a href="http://localhost:5000/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    AI Service Direct
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}