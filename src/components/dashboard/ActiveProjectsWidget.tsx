import { GlassCard } from "./GlassCard";
import { ShoppingCart, Video, Briefcase, Sparkles, ChevronRight, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useProjectStats } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { Link } from "react-router-dom";

const segmentIcons = {
  ecommerce: ShoppingCart,
  tiktok: Video,
  consulting: Briefcase,
  oracle: Sparkles,
  other: FolderKanban,
};

const segmentColors = {
  ecommerce: "bg-segment-ecommerce text-white",
  tiktok: "bg-segment-tiktok text-white",
  consulting: "bg-segment-consulting text-white",
  oracle: "bg-segment-oracle text-white",
  other: "bg-muted text-foreground",
};

const segmentBgColors = {
  ecommerce: "bg-segment-ecommerce/10",
  tiktok: "bg-segment-tiktok/10",
  consulting: "bg-segment-consulting/10",
  oracle: "bg-segment-oracle/10",
  other: "bg-muted/50",
};

const segmentLabels = {
  ecommerce: "E-Commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  other: "Autre",
};

export function ActiveProjectsWidget() {
  const { mode } = useMode();
  const stats = useProjectStats(mode);
  const { data: projects } = useProjects(mode);

  // Get unique segments with project counts
  const segmentData = Object.entries(stats.bySegment).map(([segment, count]) => ({
    segment: segment as keyof typeof segmentIcons,
    count,
  }));

  // If no projects, show default segments
  const displaySegments = segmentData.length > 0 
    ? segmentData 
    : [
        { segment: "ecommerce" as const, count: 0 },
        { segment: "tiktok" as const, count: 0 },
        { segment: "consulting" as const, count: 0 },
        { segment: "oracle" as const, count: 0 },
      ];

  return (
    <GlassCard className="col-span-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Projets actifs</h3>
          <p className="text-xs text-muted-foreground">{stats.inProgress} en cours</p>
        </div>
        <Link to="/projects" className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displaySegments.slice(0, 4).map(({ segment, count }) => {
          const Icon = segmentIcons[segment];
          
          return (
            <Link
              key={segment}
              to="/projects"
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105",
                segmentBgColors[segment]
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  segmentColors[segment]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium">{segmentLabels[segment]}</span>
                <p className="text-xs text-muted-foreground">{count} projets</p>
              </div>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
