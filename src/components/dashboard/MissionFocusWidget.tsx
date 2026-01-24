import { GlassCard } from "./GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { useGlobalFocusMissions } from "@/hooks/useMissions";
import { Progress } from "@/components/ui/progress";
import { Target, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  other: "Autre",
};

const segmentColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce/20 text-segment-ecommerce border-segment-ecommerce/30",
  tiktok: "bg-segment-tiktok/20 text-segment-tiktok border-segment-tiktok/30",
  consulting: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  oracle: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  data: "bg-segment-data/20 text-segment-data border-segment-data/30",
  tech: "bg-segment-tech/20 text-segment-tech border-segment-tech/30",
  other: "bg-muted/20 text-muted-foreground border-muted/30",
};

export function MissionFocusWidget() {
  const { mode } = useMode();
  const { data: focusMissions, isLoading } = useGlobalFocusMissions(mode);
  const navigate = useNavigate();

  const handleMissionClick = (projectId: string) => {
    navigate(`/projects/${projectId}?tab=roadmap`);
  };

  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Focus Stratégique</h3>
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
        <div className="space-y-3">
          {focusMissions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleMissionClick(mission.project_id)}
              className={cn(
                "p-3 rounded-xl border border-border/50 cursor-pointer",
                "bg-background/30 hover:bg-background/50",
                "transition-all duration-200 hover:scale-[1.02]",
                "group"
              )}
            >
              {/* Project Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  segmentColors[mission.projectSegment] || segmentColors.other
                )}>
                  {segmentLabels[mission.projectSegment] || "Autre"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Project Name */}
              <p className="text-xs text-muted-foreground truncate mb-1">
                {mission.projectName}
              </p>

              {/* Mission Title */}
              <h4 className="font-trading text-sm font-bold truncate mb-2">
                {mission.title}
              </h4>

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
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune mission en cours
          </p>
          <p className="text-xs text-muted-foreground/70">
            Crée des missions dans tes projets
          </p>
        </div>
      )}
    </GlassCard>
  );
}
