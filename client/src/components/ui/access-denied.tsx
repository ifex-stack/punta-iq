import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  returnPath?: string;
  returnLabel?: string;
}

/**
 * AccessDenied component
 * Used when a user tries to access a page they don't have permission for
 */
export function AccessDenied({
  title = "Access Denied",
  description = "You do not have permission to view this page",
  returnPath = "/",
  returnLabel = "Return to Home",
}: AccessDeniedProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="container py-6 mx-auto">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This page is restricted. If you believe you should have access, please
            contact an administrator.
          </p>
          <Button onClick={() => setLocation(returnPath)}>{returnLabel}</Button>
        </CardContent>
      </Card>
    </div>
  );
}