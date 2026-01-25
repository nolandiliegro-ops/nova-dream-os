import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { useTodayMissions, parseDurationToMinutes, formatMinutesToDisplay } from "@/hooks/useMissions";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Sun, Timer, CheckCircle2, Loader2, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Daily completion celebration - more intense!
const triggerDailyCelebration = () => {
  const duration = 4000;
  const end = Date.now() + duration;
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7', '#22c55e'];

  const frame = () => {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export function DailyBriefingWidget() {
  const { mode } = useMode();
  const { data: todayMissions, isLoading } = useTodayMissions(mode);
  const [celebrated, setCelebrated] = useState(false);

  // Calculate totals
  const totalMinutes = todayMissions?.reduce(
    (sum, m) => sum + parseDurationToMinutes(m.estimated_duration),
    0
  ) || 0;

  const completedMinutes = todayMissions?.filter(m => m.status === "completed")
    .reduce((sum, m) => sum + parseDurationToMinutes(m.estimated_duration), 0) || 0;

  const progress = totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0;
  const completedCount = todayMissions?.filter(m => m.status === "completed").length || 0;
  const totalCount = todayMissions?.length || 0;

  // Trigger celebration when 100% completed
  useEffect(() => {
    if (progress === 100 && totalMinutes > 0 && !celebrated) {
      triggerDailyCelebration();
      toast.success("🎉 Objectif du jour atteint ! Tu gères !");
      setCelebrated(true);
    }
  }, [progress, totalMinutes, celebrated]);

  // Reset celebration flag on new day
  useEffect(() => {
    setCelebrated(false);
  }, [mode]);

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Briefing du Jour</h3>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          {progress === 100 && totalCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-segment-ecommerce/20 text-segment-ecommerce text-xs font-trading">
              <Sparkles className="h-3 w-3" />
              Terminé !
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Main message */}
        {!isLoading && (
          <>
            <div className="py-2">
              {totalCount === 0 ? (
                <p className="text-lg font-trading text-muted-foreground">
                  Nono, aucune mission prévue pour aujourd'hui
                </p>
              ) : (
                <p className="text-lg font-trading">
                  Nono, aujourd'hui c'est{" "}
                  <span className="text-primary font-semibold">
                    {totalMinutes >= 60 
                      ? formatMinutesToDisplay(totalMinutes)
                      : `${totalMinutes} min`
                    }
                  </span>
                  {" "}de boulot !
                </p>
              )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {completedCount}/{totalCount} missions
                  </span>
                  <span className="font-trading">
                    {formatMinutesToDisplay(completedMinutes)} / {formatMinutesToDisplay(totalMinutes)}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    progress === 100 
                      ? "[&>div]:bg-gradient-to-r [&>div]:from-segment-ecommerce [&>div]:to-segment-ecommerce/80"
                      : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                  )}
                />
              </div>
            )}

            {/* Mission list */}
            {totalCount > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Missions du jour
                </p>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {todayMissions?.slice(0, 5).map((mission) => {
                    const isCompleted = mission.status === "completed";
                    const duration = mission.estimated_duration;
                    
                    return (
                      <div 
                        key={mission.id}
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-colors",
                          isCompleted 
                            ? "bg-segment-ecommerce/10 text-segment-ecommerce"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <Target className="h-4 w-4 flex-shrink-0 text-primary" />
                          )}
                          <span className={cn(
                            "text-sm truncate",
                            isCompleted && "line-through opacity-70"
                          )}>
                            {mission.title}
                          </span>
                        </div>
                        {duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Timer className="h-3 w-3" />
                            <span className="font-trading">{duration}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(todayMissions?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {(todayMissions?.length || 0) - 5} autre(s) mission(s)...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {totalCount === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Ajoute des missions avec deadlines aujourd'hui ou marque-les "en cours" !
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
