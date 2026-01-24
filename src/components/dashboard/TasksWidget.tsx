import { GlassCard } from "./GlassCard";
import { Circle, ChevronRight, CheckCircle2, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, useToggleTaskComplete } from "@/hooks/useTasks";
import { useMode } from "@/contexts/ModeContext";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const priorityBorderColors = {
  high: "border-destructive",
  medium: "border-segment-oracle",
  low: "border-segment-consulting",
};

export function TasksWidget() {
  const { mode } = useMode();
  const { data: tasks, isLoading } = useTasks(mode);
  const toggleComplete = useToggleTaskComplete();
  const { startTimer, state: timerState } = useTaskTimer();

  // Get only incomplete tasks, sorted by priority and due date
  const urgentTasks = tasks
    ?.filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0;
    })
    .slice(0, 4);

  const handleToggle = async (id: string) => {
    try {
      await toggleComplete.mutateAsync({ id, completed: true });
      toast.success("Tâche complétée !");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === tomorrow.toDateString()) return "Demain";
    
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} jours de retard`;
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <GlassCard className="col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Tâches urgentes</h3>
          <p className="text-xs text-muted-foreground">
            {urgentTasks?.length || 0} en attente
          </p>
        </div>
        <Link to="/tasks" className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : urgentTasks && urgentTasks.length > 0 ? (
        <div className="space-y-3">
          {urgentTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border-l-2 bg-secondary/30 p-3 transition-all hover:bg-secondary/50 group",
                priorityBorderColors[task.priority]
              )}
            >
              <button 
                onClick={() => handleToggle(task.id)}
                className="mt-0.5 rounded-full p-0.5 hover:bg-secondary transition-colors"
              >
                <Circle className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</p>
              </div>
              <button
                onClick={() => startTimer(task.id, task.title)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-primary/20",
                  timerState.taskId === task.id && "opacity-100 text-primary"
                )}
                title="Démarrer le timer"
              >
                <Play className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-segment-ecommerce" />
          <p className="text-sm text-muted-foreground">Aucune tâche urgente !</p>
          <Link to="/tasks" className="text-xs text-primary hover:underline">
            Ajouter une tâche
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
