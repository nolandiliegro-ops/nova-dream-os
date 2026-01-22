import { GlassCard } from "./GlassCard";
import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function DeadlineWidget() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 5,
    hours: 33,
    minutes: 58,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    targetDate.setHours(targetDate.getHours() + 10);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="col-span-1" segment="oracle" glowOnHover>
      <p className="text-sm text-muted-foreground mb-2">Next Deadline: Q3 Report</p>
      
      <div className="flex items-baseline gap-1 justify-center">
        <div className="text-center">
          <span className="text-4xl font-bold tabular-nums">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">day</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="text-center">
          <span className="text-4xl font-bold tabular-nums">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">min</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <div className="text-center">
          <span className="text-4xl font-bold tabular-nums animate-pulse">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <p className="text-xs text-muted-foreground mt-1">left</p>
        </div>
      </div>
    </GlassCard>
  );
}
