import { useState, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { useGlobalFocusMissions, useCompleteMission, useUpdateMission, FocusMission } from "@/hooks/useMissions";
import { useProjects } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, ChevronRight, Loader2, Plus, CalendarDays, Star, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddGlobalMissionDialog } from "./AddGlobalMissionDialog";
import { MissionWorkspaceDialog } from "@/components/project-workspace/MissionWorkspaceDialog";
import { format, differenceInHours, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { getSegmentLabel } from "@/config/segments";

// Badge colors for mission segments
const segmentBadgeColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce/20 text-segment-ecommerce border-segment-ecommerce/30",
  tiktok: "bg-segment-tiktok/20 text-segment-tiktok border-segment-tiktok/30",
  consulting: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  oracle: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  data: "bg-segment-data/20 text-segment-data border-segment-data/30",
  tech: "bg-segment-tech/20 text-segment-tech border-segment-tech/30",
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

type SortOption = "deadline" | "progress";

export function MissionFocusWidget() {
  const { mode } = useMode();
  const { data: focusMissions, isLoading } = useGlobalFocusMissions(mode);
  const { data: projects } = useProjects(mode);
  const completeMission = useCompleteMission();
  const updateMission = useUpdateMission();
  
  // Mission workspace dialog state
  const [selectedMission, setSelectedMission] = useState<FocusMission | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter state
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");

  // Calculate counts
  const totalMissions = focusMissions?.length || 0;
  const focusCount = focusMissions?.filter(m => m.is_focus).length || 0;

  // Filter and sort missions
  const filteredMissions = useMemo(() => {
    if (!focusMissions) return [];
    
    let result = [...focusMissions];
    
    // Filter by project
    if (projectFilter !== "all") {
      result = result.filter(m => m.project_id === projectFilter);
    }
    
    // Sort (is_focus always first, then by selected criteria)
    result.sort((a, b) => {
      // 1. is_focus always first
      if (a.is_focus && !b.is_focus) return -1;
      if (!a.is_focus && b.is_focus) return 1;
      
      // 2. By selected criteria
      if (sortBy === "deadline") {
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
      } else if (sortBy === "progress") {
        return b.progress - a.progress;
      }
      
      return 0;
    });
    
    return result;
  }, [focusMissions, projectFilter, sortBy]);

  const handleMissionClick = (mission: FocusMission) => {
    setSelectedMission(mission);
    setWorkspaceOpen(true);
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

  const handleToggleFocus = async (missionId: string, currentFocus: boolean) => {
    try {
      await updateMission.mutateAsync({ id: missionId, is_focus: !currentFocus });
      toast.success(currentFocus ? "Mission retirée du focus" : "Mission ajoutée au focus");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <>
      <GlassCard className="h-full">
        {/* Header with counter */}
        <div className="flex items-center justify-between mb-3">
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
            {focusCount > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-segment-oracle fill-segment-oracle" />
                {focusCount} prioritaire{focusCount > 1 ? "s" : ""} sur {totalMissions}
              </span>
            ) : (
              `${totalMissions} mission${totalMissions > 1 ? "s" : ""}`
            )}
          </span>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Sort Toggle */}
          <Button
            variant={sortBy === "deadline" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-full gap-1"
            onClick={() => setSortBy(sortBy === "deadline" ? "progress" : "deadline")}
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === "deadline" ? "Date" : "Progression"}
          </Button>
          
          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-7 w-[140px] text-xs rounded-full">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMissions.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className={cn(
                  "p-3 rounded-xl border border-border/50",
                  "bg-background/30 hover:bg-background/50",
                  "transition-all duration-200",
                  "group",
                  mission.is_focus && "ring-1 ring-segment-oracle/30 bg-segment-oracle/5"
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
                  {/* Focus Star */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 rounded-full transition-all p-0",
                      mission.is_focus 
                        ? "text-segment-oracle hover:text-segment-oracle/80" 
                        : "text-muted-foreground hover:text-segment-oracle opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFocus(mission.id, mission.is_focus);
                    }}
                    title={mission.is_focus ? "Retirer du focus" : "Ajouter au focus"}
                  >
                    <Star className={cn("h-3.5 w-3.5", mission.is_focus && "fill-current")} />
                  </Button>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border",
                    segmentBadgeColors[mission.projectSegment] || segmentBadgeColors.other
                  )}>
                    {getSegmentLabel(mission.projectSegment)}
                  </span>
                  <div 
                    className="flex-1 flex items-center justify-end cursor-pointer"
                    onClick={() => handleMissionClick(mission)}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Clickable content area */}
                <div 
                  className="cursor-pointer"
                  onClick={() => handleMissionClick(mission)}
                >
                  {/* Project Name */}
                  <p 
                    className="text-xs text-muted-foreground mb-1"
                    style={{ 
                      overflowWrap: 'break-word', 
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal',
                      hyphens: 'auto'
                    }}
                  >
                    {mission.projectName}
                  </p>

                  {/* Mission Title */}
                  <h4 
                    className="font-trading text-sm font-bold mb-2"
                    style={{ 
                      overflowWrap: 'break-word', 
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal',
                      hyphens: 'auto'
                    }}
                  >
                    {mission.title}
                  </h4>

                  {/* Deadline if present */}
                  {mission.deadline && (
                    <div className={cn(
                      "flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full w-fit",
                      isDeadlinePast(mission.deadline)
                        ? "bg-destructive/20 text-destructive animate-pulse"
                        : isDeadlineUrgent(mission.deadline)
                          ? "bg-segment-oracle/20 text-segment-oracle animate-pulse"
                          : "bg-muted/50 text-muted-foreground"
                    )}>
                      <CalendarDays className="h-3 w-3" />
                      <span className="text-xs font-trading">
                        {format(new Date(mission.deadline), "d MMM", { locale: fr })}
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
              {projectFilter !== "all" ? "Aucune mission pour ce projet" : "Aucune mission en cours"}
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
      
      {/* Mission Workspace Dialog */}
      <MissionWorkspaceDialog
        mission={selectedMission}
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        projectId={selectedMission?.project_id}
      />
    </>
  );
}
