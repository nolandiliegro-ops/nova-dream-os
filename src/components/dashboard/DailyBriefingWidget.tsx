import { useEffect, useState, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { formatMinutesToDisplay } from "@/hooks/useMissions";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useWeeklyTaskLoad, DayLoadWithTasks } from "@/hooks/useWeeklyTaskLoad";
import { useDailyActionPlan } from "@/hooks/useDailyActionPlan";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Sun, Loader2, Sparkles, AlertTriangle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { TaskGroupSection } from "./TaskGroupSection";

// Daily completion celebration
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

// Custom tooltip for the weekly chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DayLoadWithTasks;
    return (
      <div className="glass-card px-3 py-2 text-xs max-w-[220px] border border-border/50 shadow-lg">
        <p className="font-medium mb-1">{data.date}</p>
        <p className={cn(
          "font-trading mb-2",
          data.isOverloaded ? "text-destructive" : "text-primary"
        )}>
          {formatMinutesToDisplay(data.minutes)} ({data.taskCount} tâche{data.taskCount > 1 ? "s" : ""})
        </p>
        {data.tasks.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border/50">
            {data.tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">{task.title}</span>
                <span className="flex-shrink-0 font-trading">{formatMinutesToDisplay(task.estimatedTime)}</span>
              </div>
            ))}
            {data.tasks.length > 5 && (
              <p className="text-muted-foreground text-center pt-1">
                +{data.tasks.length - 5} autre{data.tasks.length - 5 > 1 ? "s" : ""}...
              </p>
            )}
          </div>
        )}
        {data.tasks.length === 0 && (
          <p className="text-muted-foreground italic">Aucune tâche prévue</p>
        )}
      </div>
    );
  }
  return null;
};

export function DailyBriefingWidget() {
  const { mode } = useMode();
  const { data: goals } = useUserGoals(2026, mode);
  const dailyCapacity = goals?.daily_focus_capacity || 360;
  
  const { data: actionPlan, isLoading } = useDailyActionPlan(mode, dailyCapacity);
  const { data: weeklyTaskData } = useWeeklyTaskLoad(mode, dailyCapacity);
  const [celebrated, setCelebrated] = useState(false);

  const {
    totalMinutes,
    completedMinutes,
    progress,
    taskCount,
    completedCount,
    isOverloaded,
    groups,
  } = actionPlan;

  const overloadMinutes = totalMinutes - dailyCapacity;

  // Trigger celebration when 100% completed
  useEffect(() => {
    if (progress === 100 && taskCount > 0 && !celebrated) {
      triggerDailyCelebration();
      toast.success("🎉 Objectif du jour atteint ! Tu gères !");
      setCelebrated(true);
    }
  }, [progress, taskCount, celebrated]);

  // Reset celebration flag on mode change
  useEffect(() => {
    setCelebrated(false);
  }, [mode]);

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Gradient accent */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        isOverloaded 
          ? "bg-gradient-to-br from-destructive/10 via-transparent to-destructive/10"
          : "bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
      )} />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-xl bg-gradient-to-br",
              isOverloaded 
                ? "from-destructive/20 to-destructive/10"
                : "from-primary/20 to-primary/10"
            )}>
              {isOverloaded ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium">Plan du Jour</h3>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          {progress === 100 && taskCount > 0 && (
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

        {/* Main content */}
        {!isLoading && (
          <>
            {/* Main message */}
            <div className="py-2">
              {taskCount === 0 ? (
                <p className="text-lg font-trading text-muted-foreground">
                  Nono, aucune tâche prévue pour aujourd'hui
                </p>
              ) : isOverloaded ? (
                <div className="space-y-1">
                  <p className="text-lg font-trading text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    Attention Nono, journée surchargée !
                  </p>
                  <p className="text-sm text-destructive/80">
                    {formatMinutesToDisplay(totalMinutes)} en {taskCount} tâches vs {formatMinutesToDisplay(dailyCapacity)} de capacité 
                    <span className="font-trading ml-1">(+{formatMinutesToDisplay(overloadMinutes)})</span>
                  </p>
                </div>
              ) : (
                <p className="text-lg font-trading">
                  Nono, aujourd'hui c'est{" "}
                  <span className="text-primary font-semibold">
                    {formatMinutesToDisplay(totalMinutes)}
                  </span>
                  {" "}en{" "}
                  <span className="text-primary font-semibold">{taskCount} tâche{taskCount > 1 ? "s" : ""}</span>
                  {" "}!
                </p>
              )}
            </div>

            {/* Progress bar */}
            {taskCount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3 w-3" />
                    {completedCount}/{taskCount} tâches
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
                      : isOverloaded
                        ? "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-destructive/80"
                        : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                  )}
                />
              </div>
            )}

            {/* Weekly Load Chart */}
            {weeklyTaskData && weeklyTaskData.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Charge des 7 prochains jours
                </p>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTaskData} barCategoryGap="20%">
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="hours" 
                        radius={[4, 4, 0, 0]}
                      >
                        {weeklyTaskData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.isOverloaded ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                            opacity={index === 0 ? 1 : 0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Capacité : {formatMinutesToDisplay(dailyCapacity)}/jour
                </p>
              </div>
            )}

            {/* Task groups */}
            {taskCount > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tâches du jour
                </p>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {groups.map(group => (
                    <TaskGroupSection key={group.groupKey} group={group} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {taskCount === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Planifie des tâches avec une date d'échéance aujourd'hui !
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
