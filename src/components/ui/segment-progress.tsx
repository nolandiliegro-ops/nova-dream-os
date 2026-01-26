import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

// Mapping from segment to Tailwind bg classes
const SEGMENT_INDICATOR_COLORS: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce",
  tiktok: "bg-segment-tiktok",
  consulting: "bg-segment-consulting",
  oracle: "bg-segment-oracle",
  data: "bg-segment-data",
  tech: "bg-segment-tech",
  hobby: "bg-segment-oracle",
  wellness: "bg-segment-data",
  travel: "bg-segment-consulting",
  other: "bg-primary",
};

interface SegmentProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  segment?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SegmentProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  SegmentProgressProps
>(({ className, value, segment = "other", size = "md", showLabel = false, ...props }, ref) => {
  const indicatorColor = SEGMENT_INDICATOR_COLORS[segment] || SEGMENT_INDICATOR_COLORS.other;
  
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
          className={cn(
            "h-full flex-1 transition-all duration-500 ease-out rounded-full",
            indicatorColor
          )}
          style={{ width: `${value || 0}%` }}
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
