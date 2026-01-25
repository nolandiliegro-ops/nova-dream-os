import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mission, MissionWithProgress } from "./useMissions";

const STALE_TIME_1_MIN = 60 * 1000;

export interface MissionWithContext extends MissionWithProgress {
  projectName: string | null;
  projectSegment: string | null;
  projectMode: "work" | "personal";
}

/**
 * V4.1: Fetch ALL missions (including orphans without project_id)
 * Returns missions enriched with project context when available
 */
export function useAllMissions(mode?: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "all", mode],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      // 1. Fetch all projects for mapping
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, segment, mode");

      // 2. Fetch ALL missions
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .order("deadline", { ascending: true, nullsFirst: false });

      if (missionsError) throw missionsError;

      // 3. Get all mission IDs for task lookup
      const missionIds = (missions || []).map(m => m.id);

      // 4. Fetch tasks linked to these missions
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, mission_id, status")
        .in("mission_id", missionIds);

      // 5. Map missions with project info and progress
      const enrichedMissions: MissionWithContext[] = (missions || []).map((mission) => {
        const project = projects?.find(p => p.id === mission.project_id);
        const missionTasks = (tasks || []).filter(t => t.mission_id === mission.id);
        const completedTasks = missionTasks.filter(t => t.status === "completed").length;
        const totalTasks = missionTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...mission,
          status: mission.status as "pending" | "in_progress" | "completed",
          progress,
          completedTasks,
          totalTasks,
          tasks: [],
          projectName: project?.name || null,
          projectSegment: project?.segment || null,
          projectMode: (project?.mode || "work") as "work" | "personal",
        };
      });

      // 6. Filter by mode if specified
      if (mode) {
        return enrichedMissions.filter(m => {
          // For orphan missions, use direct mode (defaulting to work)
          // For project missions, use project's mode
          const effectiveMode = m.project_id ? m.projectMode : "work";
          return effectiveMode === mode;
        });
      }

      return enrichedMissions;
    },
    enabled: !!user,
  });
}

/**
 * Stats for missions
 */
export function useMissionStats(mode?: "work" | "personal") {
  const { data: missions } = useAllMissions(mode);

  const stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    focused: 0,
  };

  if (missions) {
    stats.total = missions.length;
    missions.forEach(m => {
      if (m.status === "completed") stats.completed++;
      if (m.status === "in_progress") stats.inProgress++;
      if (m.status === "pending") stats.pending++;
      if (m.is_focus && m.status !== "completed") stats.focused++;
    });
  }

  return stats;
}
