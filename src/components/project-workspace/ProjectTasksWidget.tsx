import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ListTodo, 
  Plus, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  Circle,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksByProject, useCreateTask, useToggleTaskComplete } from "@/hooks/useTasks";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { toast } from "sonner";

interface ProjectTasksWidgetProps {
  projectId: string;
  projectName: string;
  mode: "work" | "personal";
}

const priorityColors = {
  low: "text-muted-foreground",
  medium: "text-segment-oracle",
  high: "text-destructive",
};

export function ProjectTasksWidget({ projectId, projectName, mode }: ProjectTasksWidgetProps) {
  const navigate = useNavigate();
  const { data: tasks, isLoading } = useTasksByProject(projectId);
  const createTask = useCreateTask();
  const toggleComplete = useToggleTaskComplete();
  const { startTimer, state: timerState } = useTaskTimer();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        description: null,
        project_id: projectId,
        priority: "medium",
        status: "todo",
        due_date: null,
        completed_at: null,
        estimated_time: 0,
        time_spent: 0,
        mode,
        subtasks: [],
      });
      toast.success("Tâche ajoutée !");
      setNewTaskTitle("");
      setIsAdding(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleToggle = async (taskId: string, currentStatus: string) => {
    try {
      await toggleComplete.mutateAsync({
        id: taskId,
        completed: currentStatus !== "completed",
      });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const completedCount = tasks?.filter(t => t.status === "completed").length || 0;
  const totalCount = tasks?.length || 0;

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Tâches</h3>
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{totalCount})
          </span>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/tasks?project=${projectId}`)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nouvelle tâche..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={createTask.isPending}>
            {createTask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ajouter"
            )}
          </Button>
        </form>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-auto space-y-2 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          tasks.slice(0, 8).map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group",
                task.status === "completed" && "opacity-60"
              )}
            >
              <button
                onClick={() => handleToggle(task.id, task.status)}
                className="flex-shrink-0"
                disabled={toggleComplete.isPending}
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-segment-ecommerce" />
                ) : (
                  <Circle className={cn("h-5 w-5", priorityColors[task.priority])} />
                )}
              </button>
              <span className={cn(
                "text-sm truncate flex-1",
                task.status === "completed" && "line-through"
              )}>
                {task.title}
              </span>
              {task.status !== "completed" && (
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
              )}
              {task.due_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune tâche pour ce projet</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2"
            >
              Ajouter une tâche
            </Button>
          </div>
        )}

        {tasks && tasks.length > 8 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => navigate(`/tasks?project=${projectId}`)}
          >
            Voir les {tasks.length - 8} autres tâches
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
