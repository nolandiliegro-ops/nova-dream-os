import { useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Loader2
} from "lucide-react";
import { MissionWithProgress, useDeleteMission, useUpdateMission } from "@/hooks/useMissions";
import { MissionTaskList } from "./MissionTaskList";
import { toast } from "sonner";
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

export function MissionCard({ mission, isFirst, isLast }: MissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteMission = useDeleteMission();
  const updateMission = useUpdateMission();

  // Auto-update status based on progress
  const effectiveStatus = mission.progress === 100 
    ? "completed" 
    : mission.progress > 0 
      ? "in_progress" 
      : mission.status;

  const config = statusConfig[effectiveStatus];

  const handleDelete = async () => {
    try {
      await deleteMission.mutateAsync(mission.id);
      toast.success("Mission supprimée");
      setDeleteConfirmOpen(false);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = effectiveStatus === "completed" ? "pending" : "completed";
    try {
      await updateMission.mutateAsync({ id: mission.id, status: newStatus });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="relative pl-8">
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
      <div className="glass-card rounded-2xl p-4 transition-all hover:bg-muted/20">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-trading text-base truncate">{mission.title}</h4>
            {mission.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
    </div>
  );
}
