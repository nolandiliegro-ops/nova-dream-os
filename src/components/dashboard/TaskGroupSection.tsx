import { memo, useState } from "react";
import { Package, ListTodo } from "lucide-react";
import { TaskGroup } from "@/hooks/useDailyActionPlan";
import { DailyTaskRow } from "./DailyTaskRow";
import { MissionWorkspaceDialog } from "@/components/project-workspace/MissionWorkspaceDialog";
import { useMission } from "@/hooks/useMissions";
import { cn } from "@/lib/utils";
import { formatMinutesToDisplay } from "@/hooks/useMissions";

interface TaskGroupSectionProps {
  group: TaskGroup;
}

export const TaskGroupSection = memo(function TaskGroupSection({ group }: TaskGroupSectionProps) {
  const isIndependent = group.groupKey === "independent";
  const allCompleted = group.tasks.every(t => t.status === "completed");
  
  // Mission workspace dialog state
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  
  // Fetch mission data when needed
  const missionId = isIndependent ? undefined : group.groupKey;
  const { data: mission } = useMission(missionId);

  const handleMissionClick = () => {
    if (!isIndependent) {
      setWorkspaceOpen(true);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Group Header */}
      <div className={cn(
        "flex items-center justify-between gap-2 px-1",
        allCompleted && "opacity-60"
      )}>
        <button 
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground transition-colors",
            !isIndependent && "hover:text-primary cursor-pointer"
          )}
          onClick={handleMissionClick}
          disabled={isIndependent}
        >
          {isIndependent ? (
            <ListTodo className="h-3 w-3" />
          ) : (
            <Package className="h-3 w-3" />
          )}
          <span 
            className="font-medium"
            style={{ 
              overflowWrap: 'break-word', 
              wordBreak: 'break-word', 
              whiteSpace: 'normal',
              hyphens: 'auto'
            }}
          >
            {isIndependent ? "Tâches Indépendantes" : group.missionTitle}
          </span>
          {group.projectName && !isIndependent && (
            <span className="text-muted-foreground/60 hidden sm:inline">
              • {group.projectName}
            </span>
          )}
        </button>
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

      {/* Mission Workspace Dialog */}
      {!isIndependent && mission && (
        <MissionWorkspaceDialog
          mission={mission}
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
          projectId={mission.project_id}
        />
      )}
    </div>
  );
});
