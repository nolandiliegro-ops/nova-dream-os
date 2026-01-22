import { useMode } from "@/contexts/ModeContext";
import { cn } from "@/lib/utils";
import { Briefcase, User } from "lucide-react";

export const ModeSwitch = () => {
  const { mode, toggleMode } = useMode();

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wider transition-colors",
          mode === "work" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Work
      </span>
      
      <button
        onClick={toggleMode}
        className="relative inline-flex h-10 w-20 items-center rounded-full border border-border/50 bg-secondary/50 backdrop-blur-xl transition-all hover:border-primary/30"
        aria-label={`Switch to ${mode === "work" ? "personal" : "work"} mode`}
      >
        {/* Sliding indicator */}
        <span
          className={cn(
            "absolute left-1 h-8 w-8 rounded-full bg-foreground shadow-lg transition-all duration-300 ease-out flex items-center justify-center",
            mode === "personal" && "translate-x-10"
          )}
        >
          {mode === "work" ? (
            <Briefcase className="h-4 w-4 text-background" />
          ) : (
            <User className="h-4 w-4 text-background" />
          )}
        </span>
      </button>

      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wider transition-colors",
          mode === "personal" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Personal
      </span>
    </div>
  );
};
