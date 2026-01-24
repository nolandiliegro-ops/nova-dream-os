import { GlassCard } from "./GlassCard";
import { ShoppingCart, Video, Briefcase, Sparkles, ChevronRight, FolderKanban, Search, Smartphone, Palette, Heart, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useProjectStats } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { Link } from "react-router-dom";

// Segments par univers
const WORK_SEGMENTS = ["ecommerce", "tiktok", "consulting", "oracle", "tech", "data"];
const PERSONAL_SEGMENTS = ["hobby", "wellness", "travel", "other"];

const segmentIcons = {
  // Work segments
  ecommerce: ShoppingCart,
  tiktok: Video,
  consulting: Briefcase,
  oracle: Sparkles,
  data: Search,
  tech: Smartphone,
  // Personal segments
  hobby: Palette,
  wellness: Heart,
  travel: Plane,
  other: FolderKanban,
};

const segmentColors = {
  // Work segments
  ecommerce: "bg-segment-ecommerce text-white",
  tiktok: "bg-segment-tiktok text-white",
  consulting: "bg-segment-consulting text-white",
  oracle: "bg-segment-oracle text-white",
  data: "bg-segment-data text-white",
  tech: "bg-segment-tech text-white",
  // Personal segments (Teal/Emerald palette)
  hobby: "bg-segment-oracle text-white",
  wellness: "bg-segment-data text-white",
  travel: "bg-segment-consulting text-white",
  other: "bg-muted text-foreground",
};

const segmentBgColors = {
  // Work segments
  ecommerce: "bg-segment-ecommerce/10",
  tiktok: "bg-segment-tiktok/10",
  consulting: "bg-segment-consulting/10",
  oracle: "bg-segment-oracle/10",
  data: "bg-segment-data/10",
  tech: "bg-segment-tech/10",
  // Personal segments
  hobby: "bg-segment-oracle/10",
  wellness: "bg-segment-data/10",
  travel: "bg-segment-consulting/10",
  other: "bg-muted/50",
};

const segmentLabels = {
  // Work segments
  ecommerce: "E-Commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  // Personal segments
  hobby: "Hobbies",
  wellness: "Bien-être",
  travel: "Voyages",
  other: "Autre",
};

export function ActiveProjectsWidget() {
  const { mode } = useMode();
  const stats = useProjectStats(mode);
  const { data: projects } = useProjects(mode);

  // Get segments for current mode only
  const allowedSegments = mode === "work" ? WORK_SEGMENTS : PERSONAL_SEGMENTS;

  // Filter segments by mode
  const segmentData = Object.entries(stats.bySegment)
    .filter(([segment]) => allowedSegments.includes(segment))
    .map(([segment, count]) => ({
      segment: segment as keyof typeof segmentIcons,
      count,
    }));

  // Default segments par mode
  const defaultWorkSegments = [
    { segment: "ecommerce" as const, count: 0 },
    { segment: "tiktok" as const, count: 0 },
    { segment: "consulting" as const, count: 0 },
    { segment: "oracle" as const, count: 0 },
    { segment: "tech" as const, count: 0 },
  ];

  const defaultPersonalSegments = [
    { segment: "hobby" as const, count: 0 },
    { segment: "wellness" as const, count: 0 },
    { segment: "travel" as const, count: 0 },
    { segment: "other" as const, count: 0 },
  ];

  const displaySegments = segmentData.length > 0 
    ? segmentData 
    : (mode === "work" ? defaultWorkSegments : defaultPersonalSegments);

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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displaySegments.slice(0, 6).map(({ segment, count }) => {
          const Icon = segmentIcons[segment];
          
          return (
            <Link
              key={segment}
              to={`/projects?segment=${segment}`}
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
