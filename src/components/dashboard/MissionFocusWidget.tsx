import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { useGlobalFocusMissions, useCompleteMission } from "@/hooks/useMissions";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Target, ChevronRight, Loader2, Plus, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AddGlobalMissionDialog } from "./AddGlobalMissionDialog";
import { format, differenceInHours, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { SEGMENT_LABELS, getSegmentLabel } from "@/config/segments";

// Badge colors for mission segments (slightly different from icon colors)
const segmentBadgeColors: Record<string, string> = {
  // Work
  ecommerce: "bg-segment-ecommerce/20 text-segment-ecommerce border-segment-ecommerce/30",
  tiktok: "bg-segment-tiktok/20 text-segment-tiktok border-segment-tiktok/30",
  consulting: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  oracle: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  data: "bg-segment-data/20 text-segment-data border-segment-data/30",
  tech: "bg-segment-tech/20 text-segment-tech border-segment-tech/30",
  // Personal
  hobby: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  wellness: "bg-segment-data/20 text-segment-data border-segment-data/30",
  travel: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  other: "bg-muted/20 text-muted-foreground border-muted/30",
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

export function MissionFocusWidget() {
  const { mode } = useMode();
  const { data: focusMissions, isLoading } = useGlobalFocusMissions(mode);
  const completeMission = useCompleteMission();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMissionClick = (projectId: string) => {
    navigate(`/projects/${projectId}?tab=roadmap`);
  };

  const handleCheckChange = async (missionId: string, checked: boolean) => {
    try {
      await completeMission.mutateAsync({ missionId, complete: checked });
      if (checked) {
        triggerCelebration();
        toast.success("🎉 Mission terminée ! Toutes les tâches ont été complétées.");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <>
      <GlassCard className="h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Focus Stratégique</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-primary/20"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {focusMissions?.length || 0} mission{(focusMissions?.length || 0) > 1 ? "s" : ""} active{(focusMissions?.length || 0) > 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : focusMissions && focusMissions.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {focusMissions.map((mission) => (
              <div
                key={mission.id}
                className={cn(
                  "p-3 rounded-xl border border-border/50",
                  "bg-background/30 hover:bg-background/50",
                  "transition-all duration-200",
                  "group"
                )}
              >
                {/* Header with checkbox and segment */}
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => handleCheckChange(mission.id, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border",
                    segmentBadgeColors[mission.projectSegment] || segmentBadgeColors.other
                  )}>
                    {getSegmentLabel(mission.projectSegment)}
                  </span>
                  <div 
                    className="flex-1 flex items-center justify-end cursor-pointer"
                    onClick={() => handleMissionClick(mission.project_id)}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Clickable content area */}
                <div 
                  className="cursor-pointer"
                  onClick={() => handleMissionClick(mission.project_id)}
                >
                  {/* Project Name */}
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {mission.projectName}
                  </p>

                  {/* Mission Title */}
                  <h4 className="font-trading text-sm font-bold truncate mb-2">
                    {mission.title}
                  </h4>

                  {/* Deadline if present */}
                  {mission.deadline && (
                    <div className={cn(
                      "flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full w-fit",
                      isDeadlinePast(mission.deadline)
                        ? "bg-destructive/20 text-destructive animate-pulse"
                        : isDeadlineUrgent(mission.deadline)
                          ? "bg-amber-500/20 text-amber-400 animate-pulse"
                          : "bg-muted/50 text-muted-foreground"
                    )}>
                      <CalendarDays className="h-3 w-3" />
                      <span className="text-xs font-trading">
                        {format(new Date(mission.deadline), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar with Glow */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Progress 
                        value={mission.progress} 
                        className="h-1.5 [&>div]:shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                      />
                    </div>
                    <span className="text-xs font-trading text-muted-foreground min-w-[2.5rem] text-right">
                      {Math.round(mission.progress)}%
                    </span>
                  </div>

                  {/* Task info */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {mission.inProgressTasksCount > 0 
                      ? `${mission.inProgressTasksCount} tâche${mission.inProgressTasksCount > 1 ? "s" : ""} en cours`
                      : `${mission.completedTasks}/${mission.totalTasks} tâches`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune mission en cours
            </p>
            <p className="text-xs text-muted-foreground/70 mb-3">
              Crée des missions dans tes projets
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </div>
        )}
      </GlassCard>

      <AddGlobalMissionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
