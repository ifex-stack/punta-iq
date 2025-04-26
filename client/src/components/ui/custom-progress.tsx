import * as React from "react";
import { cn } from "@/lib/utils";

export interface CustomProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value, max = 100, indicatorClassName, ...props }, ref) => {
    // Ensure the value is between 0 and max
    const boundedValue = Math.max(0, Math.min(value, max));
    const percentage = (boundedValue / max) * 100;

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            indicatorClassName || "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
CustomProgress.displayName = "CustomProgress";

export { CustomProgress };