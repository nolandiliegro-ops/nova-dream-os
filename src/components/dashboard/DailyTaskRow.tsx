import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Play, Pause, Timer, Palette, Code, Container, Zap, Globe, FileText, Wrench, Video, MessageSquare, Mail, Phone, Calendar } from "lucide-react";
import { EnrichedTask } from "@/hooks/useDailyActionPlan";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useToggleTaskComplete } from "@/hooks/useTasks";
import { TaskDetailDialog } from "@/components/shared/TaskDetailDialog";
import { toast } from "sonner";

// Tool to icon mapping
const toolIcons: Record<string, React.ElementType> = {
  "Figma": Palette,
  "figma": Palette,
  "VS Code": Code,
  "vscode": Code,
  "Docker": Container,
  "docker": Container,
  "Vercel": Zap,
  "vercel": Zap,
  "Chrome": Globe,
  "chrome": Globe,
  "Browser": Globe,
  "browser": Globe,
  "Notion": FileText,
  "notion": FileText,
  "Docs": FileText,
  "docs": FileText,
  "Video": Video,
  "video": Video,
  "Loom": Video,
  "loom": Video,
  "Slack": MessageSquare,
  "slack": MessageSquare,
  "Discord": MessageSquare,
  "discord": MessageSquare,
  "Email": Mail,
  "email": Mail,
  "Gmail": Mail,
  "gmail": Mail,
  "Phone": Phone,
  "phone": Phone,
  "Call": Phone,
  "call": Phone,
  "Calendar": Calendar,
  "calendar": Calendar,
  "Meet": Video,
  "meet": Video,
  "Zoom": Video,
  "zoom": Video,
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

interface DailyTaskRowProps {
  task: EnrichedTask;
}

export const DailyTaskRow = memo(function DailyTaskRow({ task }: DailyTaskRowProps) {
  const { state: timerState, startTimer, pauseTimer, resumeTimer } = useTaskTimer();
  const toggleComplete = useToggleTaskComplete();
  const [detailOpen, setDetailOpen] = useState(false);
  
  const isCompleted = task.status === "completed";
  const isThisTaskActive = timerState.taskId === task.id;
  const isRunning = isThisTaskActive && timerState.isRunning;

  // Convert EnrichedTask to Task format for dialog
  const taskForDialog = {
    id: task.id,
    user_id: "",
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate,
    completed_at: null,
    estimated_time: task.estimatedTime,
    time_spent: task.timeSpent,
    mode: "work" as const,
    project_id: task.projectId,
    mission_id: task.missionId,
    subtasks: [],
    required_tools: task.requiredTools,
    created_at: "",
    updated_at: "",
  };

  const handleToggleComplete = () => {
    toggleComplete.mutate(
      { id: task.id, completed: !isCompleted },
      {
        onSuccess: () => {
          if (!isCompleted) {
            toast.success(`✓ ${task.title}`);
          }
        },
      }
    );
  };

  const handleTimerToggle = () => {
    if (isThisTaskActive && timerState.isRunning) {
      pauseTimer();
    } else if (isThisTaskActive) {
      resumeTimer();
    } else {
      startTimer(task.id, task.title);
    }
  };

  const getToolIcon = (tool: string) => {
    const Icon = toolIcons[tool] || Wrench;
    return Icon;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all group",
        isCompleted
          ? "bg-segment-ecommerce/10 text-segment-ecommerce"
          : isThisTaskActive
            ? "bg-primary/20 ring-1 ring-primary/50"
            : "bg-muted/50 hover:bg-muted"
      )}
    >
      {/* Left: Checkbox + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isCompleted ? (
          <Checkbox
            checked={true}
            onCheckedChange={handleToggleComplete}
            className="data-[state=checked]:bg-segment-ecommerce data-[state=checked]:border-segment-ecommerce"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 flex-shrink-0 rounded-full",
                isRunning
                  ? "bg-primary/20 text-primary animate-pulse"
                  : "hover:bg-primary/20"
              )}
              onClick={handleTimerToggle}
            >
              {isRunning ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3 text-primary" />
              )}
            </Button>
            <Checkbox
              checked={false}
              onCheckedChange={handleToggleComplete}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
        <span
          className={cn(
            "text-sm truncate cursor-pointer hover:text-primary transition-colors",
            isCompleted && "line-through opacity-70"
          )}
          onClick={() => setDetailOpen(true)}
          title="Ouvrir les détails"
        >
          {task.title}
        </span>
      </div>

      {/* Right: Tools + Duration */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Tool icons */}
        {task.requiredTools.length > 0 && (
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              {task.requiredTools.slice(0, 3).map((tool, idx) => {
                const Icon = getToolIcon(tool);
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="p-1 rounded bg-muted/80">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {tool}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {task.requiredTools.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  +{task.requiredTools.length - 3}
                </Badge>
              )}
            </div>
          </TooltipProvider>
        )}

        {/* Duration badge */}
        {task.estimatedTime > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="h-3 w-3" />
            <span className="font-trading">{formatMinutes(task.estimatedTime)}</span>
          </div>
        )}
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={taskForDialog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
});
