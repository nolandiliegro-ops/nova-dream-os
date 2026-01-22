import { useMode } from "@/contexts/ModeContext";
import { cn } from "@/lib/utils";
import { Briefcase, User } from "lucide-react";

export const ModeSwitch = () => {
  const { mode, toggleMode } = useMode();

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wider transition-all duration-300",
          mode === "work" 
            ? "text-foreground scale-105" 
            : "text-muted-foreground scale-100 opacity-60"
        )}
      >
        Work
      </span>
      
      <button
        onClick={toggleMode}
        className={cn(
          "relative inline-flex h-12 w-24 items-center rounded-full border-2 backdrop-blur-xl transition-all duration-300 ease-out",
          mode === "work" 
            ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            : "border-segment-oracle/50 bg-segment-oracle/10 shadow-[0_0_20px_rgba(var(--segment-oracle),0.3)]"
        )}
        aria-label={`Switch to ${mode === "work" ? "personal" : "work"} mode`}
      >
        {/* Background glow effect */}
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-300",
            mode === "work" 
              ? "bg-gradient-to-r from-primary/20 to-transparent opacity-100"
              : "bg-gradient-to-l from-segment-oracle/20 to-transparent opacity-100"
          )}
        />
        
        {/* Sliding indicator */}
        <span
          className={cn(
            "absolute left-1 h-9 w-9 rounded-full shadow-lg transition-all duration-300 ease-out flex items-center justify-center",
            mode === "work" 
              ? "translate-x-0 bg-primary" 
              : "translate-x-[52px] bg-segment-oracle"
          )}
        >
          {mode === "work" ? (
            <Briefcase className="h-4 w-4 text-primary-foreground transition-transform duration-200" />
          ) : (
            <User className="h-4 w-4 text-white transition-transform duration-200" />
          )}
        </span>
        
        {/* Mode indicator dots */}
        <span className="absolute left-[14px] flex items-center justify-center">
          <span 
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              mode === "work" ? "bg-transparent" : "bg-muted-foreground/30"
            )} 
          />
        </span>
        <span className="absolute right-[14px] flex items-center justify-center">
          <span 
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              mode === "personal" ? "bg-transparent" : "bg-muted-foreground/30"
            )} 
          />
        </span>
      </button>

      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wider transition-all duration-300",
          mode === "personal" 
            ? "text-foreground scale-105" 
            : "text-muted-foreground scale-100 opacity-60"
        )}
      >
        Personal
      </span>
    </div>
  );
};
