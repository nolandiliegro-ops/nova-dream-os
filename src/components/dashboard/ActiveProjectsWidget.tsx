import { GlassCard } from "./GlassCard";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useProjectStats } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { Link } from "react-router-dom";
import {
  WORK_SEGMENTS,
  PERSONAL_SEGMENTS,
  SEGMENT_ICONS,
  SEGMENT_COLORS,
  SEGMENT_BG_COLORS,
  SEGMENT_LABELS,
  getSegmentIcon,
  getSegmentColor,
  getSegmentBgColor,
  getSegmentLabel,
} from "@/config/segments";

export function ActiveProjectsWidget() {
  const { mode } = useMode();
  const stats = useProjectStats(mode);
  const { data: projects } = useProjects(mode);

  // Get segments for current mode only
  const allowedSegmentValues = mode === "work" 
    ? WORK_SEGMENTS.map(s => s.value) 
    : PERSONAL_SEGMENTS.map(s => s.value);

  // Filter segments by mode
  const segmentData = Object.entries(stats.bySegment)
    .filter(([segment]) => allowedSegmentValues.includes(segment))
    .map(([segment, count]) => ({
      segment,
      count,
    }));

  // Default segments par mode
  const defaultWorkSegments = [
    { segment: "ecommerce", count: 0 },
    { segment: "tiktok", count: 0 },
    { segment: "consulting", count: 0 },
    { segment: "oracle", count: 0 },
    { segment: "tech", count: 0 },
  ];

  const defaultPersonalSegments = [
    { segment: "hobby", count: 0 },
    { segment: "wellness", count: 0 },
    { segment: "travel", count: 0 },
    { segment: "other", count: 0 },
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
          const Icon = getSegmentIcon(segment);
          
          return (
            <Link
              key={segment}
              to={`/projects?segment=${segment}`}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105",
                getSegmentBgColor(segment)
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  getSegmentColor(segment)
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium">{getSegmentLabel(segment)}</span>
                <p className="text-xs text-muted-foreground">{count} projets</p>
              </div>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
