import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  segment?: "ecommerce" | "tiktok" | "consulting" | "oracle";
  glowOnHover?: boolean;
}

export function GlassCard({
  children,
  className,
  segment,
  glowOnHover = false,
  ...props
}: GlassCardProps) {
  const segmentClasses = {
    ecommerce: "hover:border-segment-ecommerce/30",
    tiktok: "hover:border-segment-tiktok/30",
    consulting: "hover:border-segment-consulting/30",
    oracle: "hover:border-segment-oracle/30",
  };

  const glowClasses = {
    ecommerce: "hover:shadow-[0_0_30px_-5px_hsl(var(--segment-ecommerce)/0.3)]",
    tiktok: "hover:shadow-[0_0_30px_-5px_hsl(var(--segment-tiktok)/0.3)]",
    consulting: "hover:shadow-[0_0_30px_-5px_hsl(var(--segment-consulting)/0.3)]",
    oracle: "hover:shadow-[0_0_30px_-5px_hsl(var(--segment-oracle)/0.3)]",
  };

  return (
    <div
      className={cn(
        "glass-card p-4 md:p-6 transition-all duration-300",
        segment && segmentClasses[segment],
        segment && glowOnHover && glowClasses[segment],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
