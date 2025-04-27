import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Fingerprint, Key, Scan, ShieldCheck, AlertTriangle } from "lucide-react";

interface BiometricAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  setupMode?: boolean;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ 
  onSuccess, 
  onCancel,
  setupMode = false 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if biometric auth is supported
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        // Check if the browser supports WebAuthn
        if (window.PublicKeyCredential) {
          // Check if biometrics are available on the device
          const availableOptions = await (navigator as any).credentials?.getAvailableAuthenticationMethods?.() || [];
          const hasBiometrics = availableOptions.includes('platform');
          
          setIsSupported(hasBiometrics);
          
          if (!hasBiometrics) {
            setError("Biometric authentication is not available on this device.");
          }
        } else {
          setIsSupported(false);
          setError("Your browser doesn't support biometric authentication.");
        }
      } catch (err) {
        console.error("Error checking biometric support:", err);
        setIsSupported(false);
        setError("Failed to check biometric support.");
      }
    };

    checkBiometricSupport();
  }, []);

  // Start biometric authentication process
  const startBiometricAuth = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Biometric authentication is not available on this device.",
        variant: "destructive",
      });
      return;
    }

    setError("");
    setIsScanning(true);
    
    try {
      if (setupMode) {
        // In setup mode, register a new credential for future biometric auth
        await registerBiometric();
      } else {
        // In auth mode, verify existing credential
        await verifyBiometric();
      }
    } catch (err) {
      console.error("Biometric auth error:", err);
      setError("Authentication failed. Please try again.");
      setIsScanning(false);
    }
  };

  // Register a new biometric credential
  const registerBiometric = async () => {
    try {
      // First request a challenge from the server
      const challengeResponse = await apiRequest("GET", "/api/auth/biometric-challenge");
      const challenge = await challengeResponse.json();
      
      if (!challengeResponse.ok) {
        throw new Error(challenge.message || "Failed to get challenge");
      }
      
      // Create new credential
      const credential = await (navigator as any).credentials.create({
        publicKey: {
          challenge: stringToBuffer(challenge.challenge),
          rp: { name: "PuntaIQ" },
          user: {
            id: stringToBuffer(user?.id.toString() || "guest"),
            name: user?.username || "guest",
            displayName: user?.username || "Guest User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Using platform authenticator (like FaceID)
            userVerification: "required",
          },
        },
      });
      
      // Register the credential with the server
      const registrationResponse = await apiRequest("POST", "/api/auth/register-biometric", {
        userId: user?.id,
        credential: {
          id: credential.id,
          rawId: bufferToString(credential.rawId),
          response: {
            clientDataJSON: bufferToString(credential.response.clientDataJSON),
            attestationObject: bufferToString(credential.response.attestationObject),
          },
          type: credential.type,
        },
      });
      
      if (registrationResponse.ok) {
        toast({
          title: "Biometric setup complete",
          description: "You can now use Face ID to login",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const data = await registrationResponse.json();
        setError(data.message || "Failed to register biometric credential");
      }
    } catch (err) {
      console.error("Biometric registration error:", err);
      
      if ((err as Error).name === "NotAllowedError") {
        setError("Permission denied by user or device.");
      } else if ((err as Error).name === "NotSupportedError") {
        setError("Your device doesn't support the requested authentication method.");
      } else {
        setError("Failed to set up biometric authentication. Please try again.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Verify existing biometric credential
  const verifyBiometric = async () => {
    try {
      // First request a challenge from the server
      const challengeResponse = await apiRequest("GET", "/api/auth/biometric-challenge");
      const challenge = await challengeResponse.json();
      
      if (!challengeResponse.ok) {
        throw new Error(challenge.message || "Failed to get challenge");
      }
      
      // Get credential to verify user identity
      const assertion = await (navigator as any).credentials.get({
        publicKey: {
          challenge: stringToBuffer(challenge.challenge),
          timeout: 60000,
          userVerification: "required",
        },
      });
      
      // Verify the credential with the server
      const verificationResponse = await apiRequest("POST", "/api/auth/verify-biometric", {
        userId: user?.id,
        credential: {
          id: assertion.id,
          rawId: bufferToString(assertion.rawId),
          response: {
            clientDataJSON: bufferToString(assertion.response.clientDataJSON),
            authenticatorData: bufferToString(assertion.response.authenticatorData),
            signature: bufferToString(assertion.response.signature),
            userHandle: assertion.response.userHandle ? bufferToString(assertion.response.userHandle) : null,
          },
          type: assertion.type,
        },
      });
      
      if (verificationResponse.ok) {
        toast({
          title: "Authenticated",
          description: "Biometric verification successful",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const data = await verificationResponse.json();
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      console.error("Biometric verification error:", err);
      
      if ((err as Error).name === "NotAllowedError") {
        setError("Permission denied by user or device.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Utility functions for WebAuthn data conversion
  const stringToBuffer = (str: string): ArrayBuffer => {
    return Uint8Array.from(str, c => c.charCodeAt(0)).buffer;
  };

  const bufferToString = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  // If support status is still being determined
  if (isSupported === null) {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Checking Device</CardTitle>
          <CardDescription>
            Checking if your device supports biometric authentication...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">
          {isSupported 
            ? setupMode 
              ? "Set Up Face ID" 
              : "Face ID Login"
            : "Not Supported"
          }
        </CardTitle>
        <CardDescription>
          {isSupported
            ? setupMode
              ? "Register your face for quick access in the future"
              : "Use Face ID to login to your account"
            : "Your device doesn't support biometric authentication"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSupported && (
          <div className="flex flex-col items-center justify-center py-6">
            {isScanning ? (
              <div className="text-center space-y-4">
                <div className="relative mx-auto">
                  <Scan className="h-24 w-24 text-primary animate-pulse" />
                  <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
                    <div className="w-6 h-40 bg-primary/20 animate-scan rounded-full"></div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {setupMode ? "Register your face..." : "Verifying your identity..."}
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <ShieldCheck className="h-24 w-24 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Press the button below to {setupMode ? "set up" : "use"} Face ID
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isScanning}
          >
            Cancel
          </Button>
        )}
        
        <div className="ml-auto flex gap-2">
          {!isSupported && (
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              <Key className="h-5 w-5 mr-2" />
              Use PIN Instead
            </Button>
          )}
          
          {isSupported && (
            <Button 
              onClick={startBiometricAuth}
              disabled={isScanning}
            >
              <Fingerprint className="h-5 w-5 mr-2" />
              {setupMode ? "Set Up Face ID" : "Use Face ID"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};