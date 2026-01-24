import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { Task } from "@/hooks/useTasks";

interface MissionTaskListProps {
  tasks: Task[];
  maxDisplay?: number;
}

const priorityColors = {
  low: "text-muted-foreground",
  medium: "text-segment-oracle",
  high: "text-destructive",
};

export function MissionTaskList({ tasks, maxDisplay = 3 }: MissionTaskListProps) {
  const displayedTasks = tasks.slice(0, maxDisplay);
  const remainingCount = tasks.length - maxDisplay;

  return (
    <div className="space-y-2">
      {displayedTasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center gap-2 text-xs p-1.5 rounded-lg",
            task.status === "completed" && "opacity-60"
          )}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-segment-ecommerce flex-shrink-0" />
          ) : (
            <Circle className={cn("h-3.5 w-3.5 flex-shrink-0", priorityColors[task.priority])} />
          )}
          <span className={cn(
            "truncate flex-1",
            task.status === "completed" && "line-through"
          )}>
            {task.title}
          </span>
          {task.due_date && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          +{remainingCount} autre{remainingCount > 1 ? 's' : ''} tâche{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
