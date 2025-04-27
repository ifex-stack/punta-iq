import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Calendar,
  Clock,
  PauseCircle,
  Shield,
  CalendarX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Time-out Periods in days
const TIMEOUT_PERIODS = [
  { value: "1", label: "24 hours" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

// Self-exclusion Periods in months
const EXCLUSION_PERIODS = [
  { value: "6", label: "6 months" },
  { value: "12", label: "1 year" },
  { value: "24", label: "2 years" },
  { value: "60", label: "5 years" },
  { value: "permanent", label: "Permanently" },
];

export const GamblingControls: React.FC = () => {
  const [activeTab, setActiveTab] = useState("timeout");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [reason, setReason] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle form submission for timeout or self-exclusion
  const handleSubmit = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Selection required",
        description: "Please select a period before proceeding",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = activeTab === "timeout" 
        ? "/api/responsible-gambling/timeout" 
        : "/api/responsible-gambling/self-exclude";

      const response = await apiRequest("POST", endpoint, {
        userId: user?.id,
        period: selectedPeriod,
        reason: reason || "Not specified",
      });

      if (response.ok) {
        // Success
        setShowConfirmDialog(false);
        
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        toast({
          title: activeTab === "timeout" ? "Time-out activated" : "Self-exclusion activated",
          description: activeTab === "timeout"
            ? "Your account has been temporarily deactivated"
            : "Your account has been excluded for the selected period",
        });
        
        // Reset form state
        setSelectedPeriod("");
        setReason("");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Request failed");
      }
    } catch (error) {
      console.error("Gambling control error:", error);
      toast({
        title: "Request failed",
        description: (error as Error).message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Responsible Gambling Controls
        </CardTitle>
        <CardDescription>
          Tools to help you manage your gambling activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeout" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeout" className="flex items-center gap-1">
              <PauseCircle className="h-4 w-4" />
              <span>Time-out</span>
            </TabsTrigger>
            <TabsTrigger value="self-exclusion" className="flex items-center gap-1">
              <CalendarX className="h-4 w-4" />
              <span>Self-exclusion</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeout" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Take a Break</h3>
              <p className="text-muted-foreground text-sm">
                A time-out lets you take a short break from betting activities.
                During this period, you won't be able to access your account.
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Select time-out period</Label>
                <RadioGroup value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TIMEOUT_PERIODS.map((period) => (
                      <div key={period.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={period.value} id={`timeout-${period.value}`} />
                        <Label htmlFor={`timeout-${period.value}`} className="cursor-pointer">
                          {period.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="timeout-reason">Reason (optional)</Label>
                <Textarea
                  id="timeout-reason"
                  placeholder="Tell us why you're taking a break..."
                  className="min-h-[100px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              
              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!selectedPeriod}
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Take a Break
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Confirm Time-out
                    </DialogTitle>
                    <DialogDescription>
                      You're about to take a break for{" "}
                      {TIMEOUT_PERIODS.find(p => p.value === selectedPeriod)?.label || selectedPeriod}.
                      You won't be able to access your account during this period.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p>
                      This action will temporarily prevent you from:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Accessing your account</li>
                      <li>Making predictions</li>
                      <li>Participating in fantasy contests</li>
                    </ul>
                    <p className="mt-2">
                      Your account will be automatically reactivated after the selected period.
                    </p>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Confirm Time-out"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          
          <TabsContent value="self-exclusion" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Self-exclusion</h3>
              <p className="text-muted-foreground text-sm">
                Self-exclusion is a more significant step for those who want to stop gambling
                for a longer period. Your account will be suspended for the duration you select.
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Select exclusion period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCLUSION_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="exclusion-reason">Reason (optional)</Label>
                <Textarea
                  id="exclusion-reason"
                  placeholder="Tell us why you're self-excluding..."
                  className="min-h-[100px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              
              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!selectedPeriod}
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Self-exclude
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Confirm Self-exclusion
                    </DialogTitle>
                    <DialogDescription>
                      You're about to self-exclude for{" "}
                      {EXCLUSION_PERIODS.find(p => p.value === selectedPeriod)?.label || selectedPeriod}.
                      This is a significant action that will prevent you from using our services.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    <p className="font-semibold">
                      Important: This action cannot be reversed until the exclusion period ends.
                    </p>
                    <p className="mt-2">
                      During self-exclusion:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Your account will be inaccessible</li>
                      <li>You won't be able to create a new account</li>
                      <li>Any active subscriptions will be suspended</li>
                      <li>You will not receive marketing communications</li>
                    </ul>
                    {selectedPeriod === "permanent" && (
                      <p className="mt-2 font-semibold">
                        You have selected to permanently exclude yourself. Your account will be permanently deactivated
                        and cannot be reopened.
                      </p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Confirm Self-exclusion"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};