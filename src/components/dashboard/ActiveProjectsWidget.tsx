import { GlassCard } from "./GlassCard";
import { ChevronRight, FolderKanban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useProjectStats } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { Link } from "react-router-dom";
import {
  useSegments,
  getSegmentLabel,
  getSegmentIcon,
  getSegmentColor,
  getSegmentBgStyle,
} from "@/hooks/useSegments";

export function ActiveProjectsWidget() {
  const { mode } = useMode();
  const stats = useProjectStats(mode);
  const { data: projects } = useProjects(mode);
  const { data: segments, isLoading: segmentsLoading } = useSegments(mode);

  // Build segment data with counts
  const segmentData = segments?.map(segment => {
    const count = stats.bySegment[segment.slug] || 0;
    return {
      segment: segment.slug,
      name: segment.name,
      icon: segment.icon,
      color: segment.color,
      count,
    };
  }) || [];

  // Filter to show only segments with projects or first 6
  const displaySegments = segmentData.slice(0, 6);

  if (segmentsLoading) {
    return (
      <GlassCard className="col-span-1">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GlassCard>
    );
  }

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
        {displaySegments.map(({ segment, name, icon, color, count }) => {
          const Icon = getSegmentIcon(segments, segment);
          
          return (
            <Link
              key={segment}
              to={`/projects?segment=${segment}`}
              className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105"
              style={getSegmentBgStyle(segments, segment, 0.15)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium">{name}</span>
                <p className="text-xs text-muted-foreground">{count} projets</p>
              </div>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
