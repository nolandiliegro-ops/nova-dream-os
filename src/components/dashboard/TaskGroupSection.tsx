import { memo } from "react";
import { Package, ListTodo } from "lucide-react";
import { TaskGroup } from "@/hooks/useDailyActionPlan";
import { DailyTaskRow } from "./DailyTaskRow";
import { cn } from "@/lib/utils";
import { formatMinutesToDisplay } from "@/hooks/useMissions";

interface TaskGroupSectionProps {
  group: TaskGroup;
}

export const TaskGroupSection = memo(function TaskGroupSection({ group }: TaskGroupSectionProps) {
  const isIndependent = group.groupKey === "independent";
  const allCompleted = group.tasks.every(t => t.status === "completed");

  return (
    <div className="space-y-1.5">
      {/* Group Header */}
      <div className={cn(
        "flex items-center justify-between gap-2 px-1",
        allCompleted && "opacity-60"
      )}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isIndependent ? (
            <ListTodo className="h-3 w-3" />
          ) : (
            <Package className="h-3 w-3" />
          )}
          <span className="font-medium truncate max-w-[180px]">
            {isIndependent ? "Tâches Indépendantes" : group.missionTitle}
          </span>
          {group.projectName && !isIndependent && (
            <span className="text-muted-foreground/60 hidden sm:inline">
              • {group.projectName}
            </span>
          )}
        </div>
        <span className="text-xs font-trading text-muted-foreground">
          {formatMinutesToDisplay(group.totalMinutes)}
        </span>
      </div>

      {/* Tasks */}
      <div className="space-y-1 pl-0.5">
        {group.tasks.map(task => (
          <DailyTaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
});
