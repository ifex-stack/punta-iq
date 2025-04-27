import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lock, X, Check, Settings, Fingerprint } from "lucide-react";

interface PinBoxProps {
  value: string;
  index: number;
  active: boolean;
}

// Individual PIN box component
const PinBox: React.FC<PinBoxProps> = ({ value, index, active }) => {
  return (
    <div
      className={`w-12 h-14 flex items-center justify-center rounded-md text-xl font-semibold ${
        active 
          ? "border-2 border-primary" 
          : value 
            ? "border border-input bg-muted" 
            : "border border-input"
      }`}
    >
      {value ? "•" : ""}
    </div>
  );
};

interface PinLoginProps {
  onPinSuccess?: () => void;
  onCancel?: () => void;
  setupMode?: boolean;
}

export const PinLogin: React.FC<PinLoginProps> = ({ 
  onPinSuccess, 
  onCancel,
  setupMode = false 
}) => {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>(["", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pinError, setPinError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Number pad input handler
  const handleNumberPress = (num: number | string) => {
    if (isConfirming) {
      // Handle confirm PIN state
      if (activeIndex < 4) {
        const newPin = [...confirmPin];
        newPin[activeIndex] = num.toString();
        setConfirmPin(newPin);
        
        if (activeIndex === 3) {
          // PIN is complete, handle verification
          setTimeout(() => {
            const pinValue = pin.join("");
            const confirmValue = [...newPin].join("");
            
            if (pinValue !== confirmValue) {
              setPinError("PINs don't match. Please try again.");
              setConfirmPin(["", "", "", ""]);
              setActiveIndex(0);
            } else {
              // Both PINs match, save the PIN
              handleSavePin(pinValue);
            }
          }, 300);
        } else {
          setActiveIndex(activeIndex + 1);
        }
      }
    } else {
      // Handle initial PIN state
      if (activeIndex < 4) {
        const newPin = [...pin];
        newPin[activeIndex] = num.toString();
        setPin(newPin);
        
        if (activeIndex === 3) {
          // PIN is complete
          if (setupMode) {
            // In setup mode, proceed to confirm the PIN
            setTimeout(() => {
              setIsConfirming(true);
              setActiveIndex(0);
            }, 300);
          } else {
            // In login mode, verify the PIN immediately
            setTimeout(() => {
              verifyPin(newPin.join(""));
            }, 300);
          }
        } else {
          setActiveIndex(activeIndex + 1);
        }
      }
    }
  };

  // Clear last entered number
  const handleBackspace = () => {
    if (isConfirming) {
      if (activeIndex > 0) {
        const newPin = [...confirmPin];
        newPin[activeIndex - 1] = "";
        setConfirmPin(newPin);
        setActiveIndex(activeIndex - 1);
      }
    } else {
      if (activeIndex > 0) {
        const newPin = [...pin];
        newPin[activeIndex - 1] = "";
        setPin(newPin);
        setActiveIndex(activeIndex - 1);
      }
    }
    setPinError("");
  };

  // Clear the entire PIN
  const handleClear = () => {
    if (isConfirming) {
      setConfirmPin(["", "", "", ""]);
    } else {
      setPin(["", "", "", ""]);
    }
    setActiveIndex(0);
    setPinError("");
  };

  // Verify PIN with the server
  const verifyPin = async (pinValue: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-pin", {
        userId: user?.id,
        pin: pinValue
      });
      
      if (response.ok) {
        toast({
          title: "PIN verified",
          description: "Logged in successfully",
        });
        
        if (onPinSuccess) {
          onPinSuccess();
        }
      } else {
        const data = await response.json();
        setPinError(data.message || "Invalid PIN");
        setPin(["", "", "", ""]);
        setActiveIndex(0);
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      toast({
        title: "Verification failed",
        description: "Please try again",
        variant: "destructive",
      });
      setPin(["", "", "", ""]);
      setActiveIndex(0);
    }
  };

  // Save new PIN to server
  const handleSavePin = async (pinValue: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/setup-pin", {
        userId: user?.id,
        pin: pinValue
      });
      
      if (response.ok) {
        toast({
          title: "PIN setup complete",
          description: "You can now use your PIN to login",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        if (onPinSuccess) {
          onPinSuccess();
        }
      } else {
        const data = await response.json();
        setPinError(data.message || "Failed to save PIN");
        setConfirmPin(["", "", "", ""]);
        setActiveIndex(0);
      }
    } catch (error) {
      console.error("PIN setup error:", error);
      toast({
        title: "Setup failed",
        description: "Please try again",
        variant: "destructive",
      });
      setIsConfirming(false);
      setPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
      setActiveIndex(0);
    }
  };
  
  // Effect to handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 0-9
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key);
      }
      // Backspace
      else if (e.key === 'Backspace') {
        handleBackspace();
      }
      // Escape
      else if (e.key === 'Escape') {
        onCancel && onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isConfirming, pin, confirmPin]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">
          {setupMode 
            ? isConfirming 
              ? "Confirm Your PIN" 
              : "Create a PIN"
            : "Enter PIN"
          }
        </CardTitle>
        <CardDescription>
          {setupMode
            ? isConfirming
              ? "Enter the same PIN again to confirm"
              : "Set up a 4-digit PIN for quick access"
            : "Enter your 4-digit PIN to login"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PIN Input Display */}
        <div className="flex justify-center space-x-2 mb-6">
          {(isConfirming ? confirmPin : pin).map((digit, index) => (
            <PinBox
              key={index}
              value={digit}
              index={index}
              active={index === activeIndex}
            />
          ))}
        </div>

        {pinError && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-2">
            {pinError}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              type="button"
              className="h-14 text-xl font-medium"
              onClick={() => handleNumberPress(num)}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            type="button"
            className="h-14 text-xl font-medium"
            onClick={handleClear}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            type="button"
            className="h-14 text-xl font-medium"
            onClick={() => handleNumberPress(0)}
          >
            0
          </Button>
          <Button
            variant="outline"
            type="button"
            className="h-14 text-xl font-medium"
            onClick={handleBackspace}
          >
            ⌫
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        {/* Show biometric login option if available */}
        {!setupMode && (
          <Button 
            variant="outline" 
            className="ml-auto"
            onClick={() => {
              toast({
                title: "Biometric authentication",
                description: "Use Face ID to login",
              });
            }}
          >
            <Fingerprint className="h-5 w-5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};