import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingTaskTimer() {
  const { state, stopTimer, pauseTimer, resumeTimer } = useTaskTimer();

  if (!state.taskId) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "glass-card p-4 min-w-[240px]",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      {/* Header with task name */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs text-muted-foreground truncate max-w-[160px]">
          {state.taskTitle}
        </span>
      </div>

      {/* Timer display */}
      <div className="flex items-center justify-between gap-4">
        <span className={cn(
          "font-trading text-2xl tabular-nums",
          state.isRunning ? "text-primary" : "text-muted-foreground"
        )}>
          {formatTime(state.elapsed)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {state.isRunning ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-secondary"
              onClick={pauseTimer}
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-secondary"
              onClick={resumeTimer}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
            onClick={stopTimer}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
