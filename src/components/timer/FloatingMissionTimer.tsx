import { useMissionTimer } from "@/contexts/MissionTimerContext";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDurationToMinutes, formatMinutesToDisplay } from "@/hooks/useMissions";

export function FloatingMissionTimer() {
  const { state, stopTimer, pauseTimer, resumeTimer } = useMissionTimer();

  if (!state.missionId) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const estimatedMinutes = parseDurationToMinutes(state.estimatedDuration);
  const elapsedMinutes = Math.floor(state.elapsed / 60);
  const isOverEstimate = estimatedMinutes > 0 && elapsedMinutes > estimatedMinutes;

  // Calculate progress percentage
  const progressPercent = estimatedMinutes > 0 
    ? Math.min((elapsedMinutes / estimatedMinutes) * 100, 100) 
    : 0;

  return (
    <div className="fixed bottom-20 right-6 z-50 glass-card p-4 min-w-[280px] animate-fade-in">
      {/* Progress bar background */}
      {estimatedMinutes > 0 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl opacity-20 transition-all",
            isOverEstimate ? "bg-destructive" : "bg-primary"
          )}
          style={{ 
            clipPath: `inset(0 ${100 - progressPercent}% 0 0)` 
          }}
        />
      )}

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Target className={cn(
            "h-4 w-4",
            state.isRunning ? "text-primary animate-pulse" : "text-muted-foreground"
          )} />
          <span className="text-xs truncate max-w-[180px] font-medium">
            {state.missionTitle}
          </span>
        </div>

        {/* Timer Display */}
        <div className="flex items-center justify-between">
          <div>
            <span className={cn(
              "font-trading text-2xl tabular-nums",
              isOverEstimate ? "text-destructive" : "text-primary"
            )}>
              {formatTime(state.elapsed)}
            </span>
            {state.estimatedDuration && (
              <p className={cn(
                "text-xs",
                isOverEstimate ? "text-destructive" : "text-muted-foreground"
              )}>
                / {state.estimatedDuration} estimé
                {isOverEstimate && " ⚠️"}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {state.isRunning ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-segment-oracle/20"
                onClick={pauseTimer}
              >
                <Pause className="h-4 w-4 text-segment-oracle" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/20"
                onClick={resumeTimer}
              >
                <Play className="h-4 w-4 text-primary" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-destructive/20"
              onClick={stopTimer}
            >
              <Square className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
