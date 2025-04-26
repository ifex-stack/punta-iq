import * as React from "react"

import { cn } from "@/lib/utils"

export interface CustomProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  maxValue?: number
  indicatorClassName?: string
}

const CustomProgress = React.forwardRef<HTMLDivElement, CustomProgressProps>(
  ({ className, value = 0, maxValue = 100, indicatorClassName, ...props }, ref) => {
    // Ensure value is between 0 and maxValue
    const cappedValue = Math.max(0, Math.min(value, maxValue))
    const percentage = (cappedValue / maxValue) * 100
    
    // Determine indicator color based on value if not explicitly provided
    const getDefaultIndicatorClass = () => {
      if (percentage >= 85) return "bg-green-500"
      if (percentage >= 65) return "bg-yellow-500"
      return "bg-red-500"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all",
            indicatorClassName || getDefaultIndicatorClass()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
CustomProgress.displayName = "CustomProgress"

export { CustomProgress }