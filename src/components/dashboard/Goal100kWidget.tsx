import { GlassCard } from "./GlassCard";
import { useTransactionStats } from "@/hooks/useTransactions";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useMode } from "@/contexts/ModeContext";
import { Target, TrendingUp, Calendar, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Goal100kWidget() {
  const { mode } = useMode();
  const stats = useTransactionStats(mode);
  const { data: userGoals } = useUserGoals(2026, mode);

  // Dynamic goal based on mode
  const goal = userGoals?.annual_revenue_goal ?? (mode === "work" ? 100000 : 50000);
  const current = stats.totalRevenue;
  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(0, goal - current);
  const isCompleted = current >= goal;

  // Contextual labels
  const title = mode === "work" ? "Objectif CA" : "Objectif Perso";
  const subtitle = mode === "work" ? "Chiffre d'affaires annuel" : "Budget épargne/loisirs";

  // Calculate months remaining until end of 2026
  const now = new Date();
  const endOf2026 = new Date(2026, 11, 31);
  const monthsLeft = Math.max(
    1,
    (endOf2026.getFullYear() - now.getFullYear()) * 12 +
      (endOf2026.getMonth() - now.getMonth())
  );
  const monthlyTarget = remaining / monthsLeft;

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1).replace(".0", "")}k€`;
    }
    return `${amount.toFixed(0)}€`;
  };

  return (
    <GlassCard className="h-full" segment={mode === "work" ? "tech" : "data"} glowOnHover>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            mode === "work" ? "bg-segment-tech/20" : "bg-segment-data/20"
          )}>
            {mode === "work" ? (
              <Target className="h-4 w-4 text-segment-tech" />
            ) : (
              <Heart className="h-4 w-4 text-segment-data" />
            )}
          </div>
          <div>
            <span className="text-sm font-medium">{title}</span>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            isCompleted
              ? "bg-primary/20 text-primary"
              : mode === "work" 
                ? "bg-segment-tech/20 text-segment-tech"
                : "bg-segment-data/20 text-segment-data"
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Current Amount */}
      <div className="text-center mb-4">
        <p className="text-4xl font-trading">
          {formatCurrency(current)}
        </p>
        <p className="text-xs text-muted-foreground">
          sur {formatCurrency(goal)} visés
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              isCompleted
                ? "bg-gradient-to-r from-primary to-primary/70"
                : mode === "work"
                  ? "bg-gradient-to-r from-segment-tech to-primary"
                  : "bg-gradient-to-r from-segment-data to-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Milestones */}
        <div className="absolute top-0 left-1/4 h-3 w-0.5 bg-background/50" />
        <div className="absolute top-0 left-1/2 h-3 w-0.5 bg-background/50" />
        <div className="absolute top-0 left-3/4 h-3 w-0.5 bg-background/50" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Reste</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">/mois requis</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(monthlyTarget)}
            </p>
          </div>
        </div>
      </div>

      {/* Motivation message */}
      {isCompleted ? (
        <p className="text-center text-xs text-primary mt-3 font-medium">
          {mode === "work" ? "🎉 Objectif atteint ! Cap sur le million !" : "🎉 Objectif atteint ! Bravo !"}
        </p>
      ) : percentage >= 75 ? (
        <p className={cn(
          "text-center text-xs mt-3",
          mode === "work" ? "text-segment-tech" : "text-segment-data"
        )}>
          🔥 Plus que {formatCurrency(remaining)} !
        </p>
      ) : percentage >= 50 ? (
        <p className="text-center text-xs text-muted-foreground mt-3">
          💪 Mi-chemin franchi, continue !
        </p>
      ) : null}
    </GlassCard>
  );
}
