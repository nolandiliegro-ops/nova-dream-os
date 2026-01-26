import { GlassCard } from "@/components/dashboard/GlassCard";
import { SegmentProgress } from "@/components/ui/segment-progress";
import { useMissionsWithProgress } from "@/hooks/useMissions";
import { Wallet, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectBudgetWidgetProps {
  projectId: string;
  budget: number | null;
  segment: string;
  hourlyRate: number;
}

export function ProjectBudgetWidget({
  projectId,
  budget,
  segment,
  hourlyRate,
}: ProjectBudgetWidgetProps) {
  const { data: missions } = useMissionsWithProgress(projectId);

  // Calculate total time spent from all missions (in minutes)
  const totalTimeSpentMinutes = missions?.reduce((sum, m) => sum + m.time_spent, 0) || 0;
  const totalHoursSpent = totalTimeSpentMinutes / 60;

  // Calculate consumed budget
  const budgetConsumed = totalHoursSpent * hourlyRate;
  
  // Calculate progress percentage
  const budgetProgress = budget && budget > 0 
    ? Math.min((budgetConsumed / budget) * 100, 100) 
    : 0;
  
  // Remaining budget
  const budgetRemaining = budget ? budget - budgetConsumed : 0;
  const remainingPercentage = budget ? (budgetRemaining / budget) * 100 : 100;

  // Status determination
  const getStatus = () => {
    if (!budget || budget === 0) return { type: "neutral", label: "Pas de budget défini" };
    if (budgetProgress > 100) return { type: "critical", label: "Budget dépassé" };
    if (budgetProgress > 80) return { type: "warning", label: "Attention: budget limité" };
    if (budgetProgress > 50) return { type: "caution", label: "Budget en cours" };
    return { type: "healthy", label: "Budget sain" };
  };

  const status = getStatus();

  // Dynamic progress color based on consumption
  const getProgressSegment = () => {
    if (budgetProgress > 80) return "oracle"; // Orange/Warning
    if (budgetProgress > 50) return "consulting"; // Blue
    return segment; // Use project segment color
  };

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Budget Consommé</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {hourlyRate}€/h
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <SegmentProgress 
            value={budgetProgress} 
            segment={getProgressSegment()} 
            size="lg"
            showLabel
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Consommé</p>
            <p className="text-lg font-trading text-foreground">
              {budgetConsumed.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
            </p>
            <p className="text-xs text-muted-foreground">
              ({totalHoursSpent.toFixed(1)}h × {hourlyRate}€)
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Budget Total</p>
            <p className="text-lg font-trading text-foreground">
              {budget?.toLocaleString("fr-FR") || "—"}€
            </p>
            {budget && budget > 0 && (
              <p className={cn(
                "text-xs",
                remainingPercentage < 20 ? "text-destructive" : "text-muted-foreground"
              )}>
                {remainingPercentage.toFixed(0)}% restant
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
          status.type === "critical" && "bg-destructive/10 text-destructive",
          status.type === "warning" && "bg-segment-oracle/10 text-segment-oracle",
          status.type === "caution" && "bg-segment-consulting/10 text-segment-consulting",
          status.type === "healthy" && "bg-segment-ecommerce/10 text-segment-ecommerce",
          status.type === "neutral" && "bg-muted text-muted-foreground"
        )}>
          {status.type === "critical" && <AlertTriangle className="h-4 w-4" />}
          {status.type === "warning" && <AlertTriangle className="h-4 w-4" />}
          {status.type === "caution" && <TrendingUp className="h-4 w-4" />}
          {status.type === "healthy" && <CheckCircle2 className="h-4 w-4" />}
          <span>{status.label}</span>
        </div>
      </div>
    </GlassCard>
  );
}
