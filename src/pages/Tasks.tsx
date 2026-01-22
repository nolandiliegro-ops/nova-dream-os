import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, Clock, AlertTriangle, Timer, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const priorityConfig = {
  high: { label: "Haute", color: "text-destructive", bg: "bg-destructive/20" },
  medium: { label: "Moyenne", color: "text-segment-oracle", bg: "bg-segment-oracle/20" },
  low: { label: "Basse", color: "text-segment-consulting", bg: "bg-segment-consulting/20" },
};

const segmentColors: Record<string, string> = {
  ecommerce: "border-l-segment-ecommerce",
  tiktok: "border-l-segment-tiktok",
  consulting: "border-l-segment-consulting",
  oracle: "border-l-segment-oracle",
};

// Placeholder tasks avec temps estimé et temps passé
const tasks = [
  { id: 1, title: "Finaliser landing page", project: "Boutique Shopify V2", segment: "ecommerce", priority: "high", due_date: "2026-01-23", estimated_time: 120, time_spent: 45, completed: false },
  { id: 2, title: "Créer 5 vidéos TikTok", project: "Campagne TikTok Q1", segment: "tiktok", priority: "high", due_date: "2026-01-24", estimated_time: 300, time_spent: 180, completed: false },
  { id: 3, title: "Préparer présentation client", project: "Audit Client Alpha", segment: "consulting", priority: "medium", due_date: "2026-01-25", estimated_time: 90, time_spent: 90, completed: true },
  { id: 4, title: "Réviser documentation Oracle", project: "Formation Oracle Cloud", segment: "oracle", priority: "low", due_date: "2026-02-01", estimated_time: 180, time_spent: 0, completed: false },
  { id: 5, title: "Optimiser checkout", project: "Boutique Shopify V2", segment: "ecommerce", priority: "medium", due_date: "2026-01-26", estimated_time: 240, time_spent: 60, completed: false },
];

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}min`;
}

export default function Tasks() {
  const { mode } = useMode();

  // Calcul ROI
  const totalEstimated = tasks.reduce((acc, t) => acc + t.estimated_time, 0);
  const totalSpent = tasks.reduce((acc, t) => acc + t.time_spent, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const roiPercentage = totalEstimated > 0 ? ((totalEstimated - totalSpent) / totalEstimated) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Tâches <span className="text-gradient">& ROI</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Optimise ton temps pour maximiser les résultats" : "Tes tâches personnelles"}
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Stats with ROI */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tâches complétées</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(totalEstimated)}</p>
                <p className="text-xs text-muted-foreground">Temps estimé total</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-oracle/20">
                <Clock className="h-5 w-5 text-segment-oracle" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Temps passé</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                roiPercentage >= 0 ? "bg-segment-ecommerce/20" : "bg-destructive/20"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  roiPercentage >= 0 ? "text-segment-ecommerce" : "text-destructive"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  roiPercentage >= 0 ? "text-segment-ecommerce" : "text-destructive"
                )}>
                  {roiPercentage >= 0 ? "+" : ""}{roiPercentage.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">ROI Personnel</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tasks List */}
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold">Toutes les tâches</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                  segmentColors[task.segment],
                  task.completed && "opacity-60"
                )}
              >
                <Checkbox checked={task.completed} />
                
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium", task.completed && "line-through")}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.project}</p>
                </div>
                
                {/* Time tracking */}
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="h-3 w-3" />
                    <span>{formatTime(task.time_spent)}</span>
                  </div>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{formatTime(task.estimated_time)}</span>
                </div>
                
                {/* Priority badge */}
                <div className={cn(
                  "hidden sm:flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                  priorityConfig[task.priority as keyof typeof priorityConfig].bg,
                  priorityConfig[task.priority as keyof typeof priorityConfig].color
                )}>
                  {task.priority === "high" && <AlertTriangle className="h-3 w-3" />}
                  <span>{priorityConfig[task.priority as keyof typeof priorityConfig].label}</span>
                </div>
                
                {/* Due date */}
                <div className="text-xs text-muted-foreground">
                  {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
