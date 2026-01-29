import { GlassCard } from "./GlassCard";
import { useEffect, useState } from "react";
import { useNextDeadline } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function DeadlineWidget() {
  const { mode } = useMode();
  const nextDeadlineProject = useNextDeadline(mode);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!nextDeadlineProject?.deadline) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(nextDeadlineProject.deadline);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [nextDeadlineProject?.deadline]);

  // No deadline case
  if (!nextDeadlineProject || !timeLeft) {
    return (
      <GlassCard className="col-span-1" segment="oracle" glowOnHover>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Prochaine Deadline</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-muted-foreground text-sm">Aucune deadline à venir</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Ajoutez une deadline à vos projets
          </p>
        </div>
      </GlassCard>
    );
  }

  const isUrgent = timeLeft.days < 2;
  const isVeryUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <GlassCard className="col-span-1" segment="oracle" glowOnHover>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isVeryUrgent ? (
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">Prochaine Deadline</span>
        </div>
        {isUrgent && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
            Urgent
          </span>
        )}
      </div>
      
      <p 
        className="text-sm font-medium mb-3 leading-snug" 
        style={{ 
          overflowWrap: 'break-word', 
          wordBreak: 'break-word', 
          whiteSpace: 'normal',
          hyphens: 'auto'
        }}
        title={nextDeadlineProject.name}
      >
        {nextDeadlineProject.name}
      </p>

      <div className="flex items-baseline gap-1 justify-center">
        <div className="text-center">
          <span
            className={cn(
              "text-4xl font-bold tabular-nums",
              isVeryUrgent && "text-destructive"
            )}
          >
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">jour{timeLeft.days > 1 ? "s" : ""}</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="text-center">
          <span
            className={cn(
              "text-4xl font-bold tabular-nums",
              isVeryUrgent && "text-destructive"
            )}
          >
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">heure{timeLeft.hours > 1 ? "s" : ""}</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="text-center">
          <span
            className={cn(
              "text-4xl font-bold tabular-nums animate-pulse",
              isVeryUrgent && "text-destructive"
            )}
          >
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">min</p>
        </div>
      </div>
    </GlassCard>
  );
}
