import { useEffect, useState, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { useTodayMissions, parseDurationToMinutes, formatMinutesToDisplay } from "@/hooks/useMissions";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useWeeklyTaskLoad, DayLoadWithTasks } from "@/hooks/useWeeklyTaskLoad";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Sun, Timer, CheckCircle2, Loader2, Target, Sparkles, AlertTriangle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { useMissionTimer } from "@/contexts/MissionTimerContext";

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

// Custom tooltip for the weekly chart - now shows individual tasks
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
  
  const { data: todayMissions, isLoading } = useTodayMissions(mode);
  const { data: weeklyTaskData } = useWeeklyTaskLoad(mode, dailyCapacity);
  const [celebrated, setCelebrated] = useState(false);
  const { state: timerState, startTimer, pauseTimer, resumeTimer } = useMissionTimer();

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

  // Overload detection
  const isOverloaded = totalMinutes > dailyCapacity;
  const overloadMinutes = totalMinutes - dailyCapacity;

  // Sort missions: in_progress first, then by order_index
  const sortedMissions = useMemo(() => {
    if (!todayMissions) return [];
    return [...todayMissions].sort((a, b) => {
      // Completed missions at the end
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      // In progress first
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;
      // Then by order_index
      return a.order_index - b.order_index;
    });
  }, [todayMissions]);

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

  const handleTimerToggle = (mission: any) => {
    const isThisMissionActive = timerState.missionId === mission.id;
    
    if (isThisMissionActive && timerState.isRunning) {
      pauseTimer();
    } else if (isThisMissionActive) {
      resumeTimer();
    } else {
      startTimer(mission.id, mission.title, mission.estimated_duration);
    }
  };

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Gradient accent - changes based on overload status */}
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
              ) : isOverloaded ? (
                <div className="space-y-1">
                  <p className="text-lg font-trading text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    Attention Nono, journée surchargée !
                  </p>
                  <p className="text-sm text-destructive/80">
                    {formatMinutesToDisplay(totalMinutes)} prévues vs {formatMinutesToDisplay(dailyCapacity)} de capacité 
                    <span className="font-trading ml-1">(+{formatMinutesToDisplay(overloadMinutes)})</span>
                  </p>
                </div>
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
                      : isOverloaded
                        ? "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-destructive/80"
                        : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                  )}
                />
              </div>
            )}

            {/* Weekly Load Chart - Now based on individual tasks! */}
            {weeklyTaskData && weeklyTaskData.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Charge des 7 prochains jours (par tâches)
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
                {/* Capacity line indicator */}
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Capacité : {formatMinutesToDisplay(dailyCapacity)}/jour
                </p>
              </div>
            )}

            {/* Mission list with play buttons */}
            {totalCount > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Missions du jour
                </p>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {sortedMissions.slice(0, 6).map((mission) => {
                    const isCompleted = mission.status === "completed";
                    const duration = mission.estimated_duration;
                    const isThisMissionActive = timerState.missionId === mission.id;
                    const isRunning = isThisMissionActive && timerState.isRunning;
                    
                    return (
                      <div 
                        key={mission.id}
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-colors group",
                          isCompleted 
                            ? "bg-segment-ecommerce/10 text-segment-ecommerce"
                            : isThisMissionActive
                              ? "bg-primary/20 ring-1 ring-primary/50"
                              : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 flex-shrink-0 rounded-full",
                                isRunning 
                                  ? "bg-primary/20 text-primary animate-pulse"
                                  : "hover:bg-primary/20"
                              )}
                              onClick={() => handleTimerToggle(mission)}
                            >
                              {isRunning ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3 text-primary" />
                              )}
                            </Button>
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
                  {(sortedMissions.length || 0) > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {sortedMissions.length - 6} autre(s) mission(s)...
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
