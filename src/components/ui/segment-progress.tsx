import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

// Fallback mapping for static segment colors (backwards compatibility)
const SEGMENT_INDICATOR_COLORS: Record<string, string> = {
  ecommerce: "#22c55e",
  tiktok: "#a855f7",
  consulting: "#3b82f6",
  oracle: "#f97316",
  data: "#06b6d4",
  tech: "#ec4899",
  hobby: "#f97316",
  wellness: "#06b6d4",
  travel: "#3b82f6",
  other: "#6366f1",
};

interface SegmentProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  segment?: string;
  segmentColor?: string; // HEX color for dynamic segments
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SegmentProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  SegmentProgressProps
>(({ className, value, segment = "other", segmentColor, size = "md", showLabel = false, ...props }, ref) => {
  // Use dynamic color if provided, otherwise fall back to static mapping
  const indicatorColor = segmentColor || SEGMENT_INDICATOR_COLORS[segment] || SEGMENT_INDICATOR_COLORS.other;
  
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", showLabel && "gap-3")}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full flex-1 transition-all duration-500 ease-out rounded-full"
          style={{ 
            width: `${value || 0}%`,
            backgroundColor: indicatorColor,
          }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground min-w-[3ch] text-right">
          {Math.round(value || 0)}%
        </span>
      )}
    </div>
  );
});
SegmentProgress.displayName = "SegmentProgress";

export { SegmentProgress };
