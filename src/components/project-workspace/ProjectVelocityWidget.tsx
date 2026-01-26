import { useMemo } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useTasksByProject } from "@/hooks/useTasks";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { startOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectVelocityWidgetProps {
  projectId: string;
  segment: string;
}

export function ProjectVelocityWidget({ projectId, segment }: ProjectVelocityWidgetProps) {
  const { data: tasks } = useTasksByProject(projectId);

  const velocityStats = useMemo(() => {
    if (!tasks) return { thisWeek: 0, lastWeek: 0, delta: 0, trend: 0 };

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);

    // Tasks completed this week
    const thisWeekCompleted = tasks.filter((t) => {
      if (t.status !== "completed" || !t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return isWithinInterval(completedDate, {
        start: thisWeekStart,
        end: now,
      });
    }).length;

    // Tasks completed last week
    const lastWeekCompleted = tasks.filter((t) => {
      if (t.status !== "completed" || !t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return isWithinInterval(completedDate, {
        start: lastWeekStart,
        end: thisWeekStart,
      });
    }).length;

    const delta = thisWeekCompleted - lastWeekCompleted;
    const trend = lastWeekCompleted > 0 
      ? ((delta / lastWeekCompleted) * 100) 
      : thisWeekCompleted > 0 ? 100 : 0;

    return {
      thisWeek: thisWeekCompleted,
      lastWeek: lastWeekCompleted,
      delta,
      trend,
    };
  }, [tasks]);

  const getTrendColor = () => {
    if (velocityStats.delta > 0) return "text-segment-ecommerce";
    if (velocityStats.delta < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (velocityStats.delta > 0) return <TrendingUp className="h-5 w-5" />;
    if (velocityStats.delta < 0) return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getTrendBadge = () => {
    if (velocityStats.delta > 0) {
      return {
        bg: "bg-segment-ecommerce/10",
        text: "text-segment-ecommerce",
        label: `+${velocityStats.trend.toFixed(0)}% de productivité`,
      };
    }
    if (velocityStats.delta < 0) {
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        label: `${velocityStats.trend.toFixed(0)}% de productivité`,
      };
    }
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      label: "Productivité stable",
    };
  };

  const trendBadge = getTrendBadge();

  // Segment-based accent color for the cards
  const getSegmentBgClass = () => {
    const segmentBgMap: Record<string, string> = {
      ecommerce: "bg-segment-ecommerce/5 border-segment-ecommerce/20",
      tiktok: "bg-segment-tiktok/5 border-segment-tiktok/20",
      consulting: "bg-segment-consulting/5 border-segment-consulting/20",
      oracle: "bg-segment-oracle/5 border-segment-oracle/20",
      data: "bg-segment-data/5 border-segment-data/20",
      tech: "bg-segment-tech/5 border-segment-tech/20",
    };
    return segmentBgMap[segment] || "bg-muted/50 border-border";
  };

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vélocité</h3>
        </div>
        <div className={cn("flex items-center gap-1", getTrendColor())}>
          {getTrendIcon()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "p-4 rounded-xl border text-center",
            getSegmentBgClass()
          )}>
            <p className="text-3xl font-trading text-foreground mb-1">
              {velocityStats.thisWeek}
            </p>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
            <p className="text-3xl font-trading text-muted-foreground mb-1">
              {velocityStats.lastWeek}
            </p>
            <p className="text-xs text-muted-foreground">Semaine dernière</p>
          </div>
        </div>

        {/* Trend Badge */}
        <div className={cn(
          "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm",
          trendBadge.bg,
          trendBadge.text
        )}>
          {getTrendIcon()}
          <span>{trendBadge.label}</span>
        </div>

        {/* Total completed hint */}
        <p className="text-xs text-muted-foreground text-center">
          {tasks?.filter(t => t.status === "completed").length || 0} tâches terminées au total
        </p>
      </div>
    </GlassCard>
  );
}
