import { useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Loader2,
  CalendarDays,
  Pencil,
  Timer,
  Play,
  Pause,
  Star,
  ExternalLink
} from "lucide-react";
import { MissionWithProgress, useDeleteMission, useUpdateMission, useCompleteMission } from "@/hooks/useMissions";
import { MissionTaskList } from "./MissionTaskList";
import { MissionWorkspaceDialog } from "./MissionWorkspaceDialog";
import { toast } from "sonner";
import { format, differenceInHours, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import confetti from "canvas-confetti";
import { useMissionTimer } from "@/contexts/MissionTimerContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MissionCardProps {
  mission: MissionWithProgress;
  isFirst?: boolean;
  isLast?: boolean;
}

const statusConfig = {
  pending: { 
    label: "Planifiée", 
    bg: "bg-muted", 
    text: "text-muted-foreground",
    dot: "bg-muted-foreground border-muted-foreground"
  },
  in_progress: { 
    label: "En cours", 
    bg: "bg-primary/20", 
    text: "text-primary",
    dot: "bg-primary border-primary"
  },
  completed: { 
    label: "Terminée", 
    bg: "bg-segment-ecommerce/20", 
    text: "text-segment-ecommerce",
    dot: "bg-segment-ecommerce border-segment-ecommerce"
  },
};

// Celebration confetti animation
const triggerCelebration = () => {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#a855f7', '#3b82f6', '#22c55e'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#a855f7', '#3b82f6', '#22c55e'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Check if deadline is urgent (< 48h)
const isDeadlineUrgent = (deadline: string | null): boolean => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const hoursUntilDeadline = differenceInHours(deadlineDate, new Date());
  return hoursUntilDeadline >= 0 && hoursUntilDeadline <= 48;
};

const isDeadlinePast = (deadline: string | null): boolean => {
  if (!deadline) return false;
  return isPast(new Date(deadline));
};

export function MissionCard({ mission, isFirst, isLast }: MissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deadlinePopoverOpen, setDeadlinePopoverOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const deleteMission = useDeleteMission();
  const updateMission = useUpdateMission();
  const completeMission = useCompleteMission();
  const { state: timerState, startTimer, pauseTimer, resumeTimer } = useMissionTimer();

  // Auto-update status based on progress
  const effectiveStatus = mission.progress === 100 
    ? "completed" 
    : mission.progress > 0 
      ? "in_progress" 
      : mission.status;

  const config = statusConfig[effectiveStatus];
  const isUrgent = isDeadlineUrgent(mission.deadline);
  const isPastDeadline = isDeadlinePast(mission.deadline);
  
  // Timer state for this mission
  const isThisMissionActive = timerState.missionId === mission.id;
  const isTimerRunning = isThisMissionActive && timerState.isRunning;

  const handleTimerToggle = () => {
    if (isThisMissionActive && timerState.isRunning) {
      pauseTimer();
    } else if (isThisMissionActive) {
      resumeTimer();
    } else {
      startTimer(mission.id, mission.title, mission.estimated_duration);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMission.mutateAsync(mission.id);
      toast.success("Mission supprimée");
      setDeleteConfirmOpen(false);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleComplete = async () => {
    try {
      await completeMission.mutateAsync({ missionId: mission.id, complete: true });
      triggerCelebration();
      toast.success("🎉 Mission terminée ! Toutes les tâches ont été complétées.");
    } catch {
      toast.error("Erreur lors de la complétion");
    }
  };

  const handleDeadlineChange = async (date: Date | undefined) => {
    try {
      await updateMission.mutateAsync({ 
        id: mission.id, 
        deadline: date ? format(date, "yyyy-MM-dd") : null 
      });
      setDeadlinePopoverOpen(false);
      toast.success("Deadline mise à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="relative pl-8 w-full">
      {/* Stepper dot */}
      <div className={cn(
        "absolute left-0 top-4 h-4 w-4 rounded-full border-2 transition-colors",
        config.dot
      )}>
        {effectiveStatus === "completed" && (
          <CheckCircle2 className="h-3 w-3 text-white absolute -top-0.5 -left-0.5" />
        )}
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-4 pr-6 w-full overflow-visible transition-all hover:bg-muted/20 group">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3 w-full">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start gap-2 flex-wrap w-full">
              {/* Focus Star Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full transition-all flex-shrink-0",
                  mission.is_focus 
                    ? "text-segment-oracle hover:text-segment-oracle/80"
                    : "text-muted-foreground hover:text-segment-oracle opacity-0 group-hover:opacity-100"
                )}
                onClick={() => updateMission.mutateAsync({ 
                  id: mission.id, 
                  is_focus: !mission.is_focus 
                })}
                title={mission.is_focus ? "Retirer du focus" : "Ajouter au focus Dashboard"}
              >
                <Star className={cn("h-4 w-4", mission.is_focus && "fill-current")} />
              </Button>
              <button 
                onClick={() => setWorkspaceOpen(true)}
                className="font-trading text-base break-words whitespace-normal text-left hover:text-primary transition-colors cursor-pointer flex items-start gap-1 group/title min-w-0 [overflow-wrap:break-word]"
                title="Ouvrir le Mission Workspace"
              >
                <span className="break-words [overflow-wrap:break-word]">{mission.title}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </button>
              {/* Duration badge with Play button */}
              {mission.estimated_duration && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                    <Timer className="h-3 w-3" />
                    <span className="font-trading">{mission.estimated_duration}</span>
                  </div>
                  {effectiveStatus !== "completed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        isTimerRunning 
                          ? "bg-primary/20 text-primary animate-pulse"
                          : "hover:bg-primary/20 text-primary"
                      )}
                      onClick={handleTimerToggle}
                      title={isTimerRunning ? "Pause le timer" : "Démarre le timer"}
                    >
                      {isTimerRunning ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              )}
              {/* Play button when no duration */}
              {!mission.estimated_duration && effectiveStatus !== "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    isTimerRunning 
                      ? "bg-primary/20 text-primary animate-pulse"
                      : "hover:bg-primary/20 text-primary opacity-0 group-hover:opacity-100"
                  )}
                  onClick={handleTimerToggle}
                  title={isTimerRunning ? "Pause le timer" : "Démarre le timer"}
                >
                  {isTimerRunning ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              )}
              {/* Deadline badge */}
              {mission.deadline && (
                <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-trading transition-all",
                        "hover:scale-105 cursor-pointer",
                        isPastDeadline 
                          ? "bg-destructive/20 text-destructive animate-pulse"
                          : isUrgent 
                            ? "bg-segment-oracle/20 text-segment-oracle animate-pulse"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(mission.deadline), "d MMM", { locale: fr })}
                      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={mission.deadline ? new Date(mission.deadline) : undefined}
                      onSelect={handleDeadlineChange}
                      locale={fr}
                      className="rounded-2xl"
                    />
                    {mission.deadline && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground"
                          onClick={() => handleDeadlineChange(undefined)}
                        >
                          Retirer la deadline
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              {/* Add deadline if none */}
              {!mission.deadline && (
                <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted/50 text-muted-foreground hover:bg-muted transition-all"
                    >
                      <CalendarDays className="h-3 w-3" />
                      <span>Ajouter</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={handleDeadlineChange}
                      locale={fr}
                      className="rounded-2xl"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {mission.description && (
              <p className="text-xs text-muted-foreground mt-1 break-words whitespace-normal w-full">
                {mission.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
              config.bg,
              config.text
            )}>
              {config.label}
            </span>
            {effectiveStatus !== "completed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-segment-ecommerce hover:bg-segment-ecommerce/20"
                onClick={handleComplete}
                disabled={completeMission.isPending}
                title="Marquer comme terminée"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              {effectiveStatus === "completed" ? (
                <CheckCircle2 className="h-3 w-3 text-segment-ecommerce" />
              ) : mission.totalTasks > 0 ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {mission.completedTasks}/{mission.totalTasks} tâches
            </span>
            <span className="font-trading">{Math.round(mission.progress)}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={mission.progress} 
              className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-segment-ecommerce" 
            />
            {mission.progress > 0 && mission.progress < 100 && (
              <div 
                className="absolute top-0 h-2 w-1 bg-white/50 rounded-full animate-pulse"
                style={{ left: `${mission.progress}%` }}
              />
            )}
          </div>
        </div>

        {/* Task List Toggle */}
        {mission.totalTasks > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs h-7 rounded-xl"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>Voir les tâches</span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Expanded Task List */}
        {isExpanded && mission.tasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <MissionTaskList tasks={mission.tasks} maxDisplay={5} />
          </div>
        )}

        {/* Empty state for tasks */}
        {mission.totalTasks === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-2">
            Aucune tâche liée à cette mission
          </p>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette mission ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les tâches liées ne seront pas supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMission.isPending}
            >
              {deleteMission.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mission Workspace Dialog */}
      <MissionWorkspaceDialog
        mission={mission}
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        projectId={mission.project_id}
      />
    </div>
  );
}
