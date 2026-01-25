import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "./useTasks";
import { format } from "date-fns";

export interface Mission {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
  deadline: string | null;
  estimated_duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface MissionWithProgress extends Mission {
  progress: number;
  completedTasks: number;
  totalTasks: number;
  tasks: Task[];
}

export interface FocusMission extends MissionWithProgress {
  projectName: string;
  projectSegment: string;
  inProgressTasksCount: number;
}

export type MissionInsert = Omit<Mission, "id" | "created_at" | "updated_at">;

// 1 minute staleTime for optimized caching during navigation
const STALE_TIME_1_MIN = 60 * 1000;

// ============= DURATION UTILITIES =============

/**
 * Parse duration string to minutes
 * Supports: "3h", "2j", "45min", "1h30", etc.
 */
export const parseDurationToMinutes = (duration: string | null | undefined): number => {
  if (!duration) return 0;
  
  const normalized = duration.toLowerCase().trim();
  let totalMinutes = 0;
  
  // Hours: "3h", "3 heures", "1h30"
  const hoursMatch = normalized.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Days: "2j", "2 jours" (8h/jour)
  const daysMatch = normalized.match(/(\d+)\s*j/);
  if (daysMatch) {
    totalMinutes += parseInt(daysMatch[1]) * 8 * 60;
  }
  
  // Minutes: "45min", "45 minutes", "h30" (after hours)
  const minsMatch = normalized.match(/(\d+)\s*m(?:in)?/);
  if (minsMatch) {
    totalMinutes += parseInt(minsMatch[1]);
  }
  
  // Handle "1h30" pattern (30 after h without m)
  const compactMatch = normalized.match(/h(\d{1,2})(?!\d)/);
  if (compactMatch && !minsMatch) {
    totalMinutes += parseInt(compactMatch[1]);
  }
  
  return totalMinutes;
};

/**
 * Format minutes to human-readable display
 */
export const formatMinutesToDisplay = (minutes: number): string => {
  if (minutes <= 0) return "0min";
  
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  
  if (hours === 0) return `${remaining}min`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h${remaining.toString().padStart(2, '0')}`;
};

export function useMissions(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("project_id", projectId!)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Mission[];
    },
    enabled: !!user && !!projectId,
    staleTime: STALE_TIME_1_MIN,
  });
}

export function useGlobalFocusMissions(mode: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "global-focus", mode],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      // 1. Fetch all projects for this mode
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, segment")
        .eq("mode", mode);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);

      // 2. Fetch all missions for these projects
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .in("project_id", projectIds);

      if (missionsError) throw missionsError;
      if (!missions || missions.length === 0) return [];

      const missionIds = missions.map(m => m.id);

      // 3. Fetch all tasks linked to these missions
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, mission_id, status")
        .in("mission_id", missionIds);

      if (tasksError) throw tasksError;

      // 4. Calculate progress and filter active missions
      const focusMissions: FocusMission[] = missions
        .map((mission) => {
          const project = projects.find(p => p.id === mission.project_id);
          const missionTasks = (tasks || []).filter(t => t.mission_id === mission.id);
          const completedTasks = missionTasks.filter(t => t.status === "completed").length;
          const inProgressTasks = missionTasks.filter(t => t.status === "in_progress").length;
          const totalTasks = missionTasks.length;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return {
            ...mission,
            status: mission.status as "pending" | "in_progress" | "completed",
            progress,
            completedTasks,
            totalTasks,
            tasks: [],
            projectName: project?.name || "Projet inconnu",
            projectSegment: project?.segment || "other",
            inProgressTasksCount: inProgressTasks,
          };
        })
        // Filter: ALL non-completed missions (even at 0%)
        .filter((m) => m.status !== "completed" && m.progress < 100)
        // Sort by in_progress tasks count (desc), then by progress (desc)
        .sort((a, b) => {
          if (b.inProgressTasksCount !== a.inProgressTasksCount) {
            return b.inProgressTasksCount - a.inProgressTasksCount;
          }
          return b.progress - a.progress;
        })
        // Take top 5 for better visibility
        .slice(0, 5);

      return focusMissions;
    },
    enabled: !!user,
  });
}

export function useMissionsWithProgress(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "withProgress", projectId],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      // Fetch missions
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("project_id", projectId!)
        .order("order_index", { ascending: true });

      if (missionsError) throw missionsError;

      // Fetch all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId!);

      if (tasksError) throw tasksError;

      // Calculate progress for each mission
      const missionsWithProgress: MissionWithProgress[] = (missions || []).map((mission) => {
        const missionTasks = (tasks || []).filter((t) => t.mission_id === mission.id);
        const completedTasks = missionTasks.filter((t) => t.status === "completed").length;
        const totalTasks = missionTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const mappedTasks: Task[] = missionTasks.map((task) => ({
          ...task,
          priority: task.priority as "low" | "medium" | "high",
          status: task.status as "todo" | "in_progress" | "completed",
          mode: task.mode as "work" | "personal",
          subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []) as unknown as Task["subtasks"],
        }));

        return {
          ...mission,
          status: mission.status as "pending" | "in_progress" | "completed",
          progress,
          completedTasks,
          totalTasks,
          tasks: mappedTasks,
        };
      });

      return missionsWithProgress;
    },
    enabled: !!user && !!projectId,
  });
}

export function useMission(missionId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "single", missionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId!)
        .maybeSingle();

      if (error) throw error;
      return data as Mission | null;
    },
    enabled: !!user && !!missionId,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (mission: Omit<MissionInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      // Get the next order index
      const { data: existingMissions } = await supabase
        .from("missions")
        .select("order_index")
        .eq("project_id", mission.project_id)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingMissions && existingMissions.length > 0
        ? existingMissions[0].order_index + 1
        : 0;

      const { data, error } = await supabase
        .from("missions")
        .insert({
          ...mission,
          user_id: user.id,
          order_index: nextOrderIndex,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["missions", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["missions", "withProgress", variables.project_id] });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Mission> & { id: string }) => {
      const { data, error } = await supabase
        .from("missions")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateMissionsFromTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      missions,
    }: {
      projectId: string;
      missions: { title: string; description: string; estimatedDuration?: string | null }[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Get the next order index
      const { data: existingMissions } = await supabase
        .from("missions")
        .select("order_index")
        .eq("project_id", projectId)
        .order("order_index", { ascending: false })
        .limit(1);

      const startIndex = existingMissions?.[0]?.order_index ?? -1;

      // Prepare batch insert
      const missionsToInsert = missions.map((m, idx) => ({
        project_id: projectId,
        user_id: user.id,
        title: m.title,
        description: m.description,
        estimated_duration: m.estimatedDuration || null,
        status: "pending",
        order_index: startIndex + 1 + idx,
        deadline: null,
      }));

      const { error } = await supabase.from("missions").insert(missionsToInsert as never[]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}

export function useReorderMissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missions: { id: string; order_index: number }[]) => {
      const updates = missions.map(({ id, order_index }) =>
        supabase.from("missions").update({ order_index } as never).eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}

// Hook to fetch missions with deadlines for calendar view
export function useMissionsWithDeadlines(mode: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "withDeadlines", mode],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      // Fetch all projects for this mode
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, segment")
        .eq("mode", mode);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);
      const projectMap = new Map(projects.map((p) => [p.id, p]));

      // Fetch all missions for these projects
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .in("project_id", projectIds)
        .neq("status", "completed");

      if (missionsError) throw missionsError;
      if (!missions) return [];

      return missions.map((mission) => {
        const project = projectMap.get(mission.project_id);
        return {
          ...mission,
          status: mission.status as "pending" | "in_progress" | "completed",
          projectName: project?.name || "Projet inconnu",
          projectSegment: project?.segment || "other",
        };
      });
    },
    enabled: !!user,
  });
}

// Hook to complete a mission and all its tasks
export function useCompleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ missionId, complete }: { missionId: string; complete: boolean }) => {
      // Update mission status
      const { error: missionError } = await supabase
        .from("missions")
        .update({ status: complete ? "completed" : "pending" })
        .eq("id", missionId);

      if (missionError) throw missionError;

      // If completing, mark all linked tasks as completed
      if (complete) {
        const { error: tasksError } = await supabase
          .from("tasks")
          .update({ 
            status: "completed", 
            completed_at: new Date().toISOString() 
          })
          .eq("mission_id", missionId);

        if (tasksError) throw tasksError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ============= TODAY'S MISSIONS HOOK =============

export interface TodayMission extends Mission {
  projectName: string;
  projectSegment: string;
}

/**
 * Fetch missions for today:
 * - Missions with deadline = today
 * - OR missions with status = "in_progress"
 */
export function useTodayMissions(mode: "work" | "personal") {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["missions", "today", mode, today],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      // 1. Fetch all projects for this mode
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, segment")
        .eq("mode", mode);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map(p => p.id);
      const projectMap = new Map(projects.map(p => [p.id, p]));

      // 2. Fetch missions with deadline today OR in_progress status
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .in("project_id", projectIds)
        .or(`deadline.eq.${today},status.eq.in_progress`);

      if (missionsError) throw missionsError;
      if (!missions) return [];

      // 3. Map with project info
      const todayMissions: TodayMission[] = missions.map((mission) => {
        const project = projectMap.get(mission.project_id);
        return {
          ...mission,
          status: mission.status as "pending" | "in_progress" | "completed",
          projectName: project?.name || "Projet inconnu",
          projectSegment: project?.segment || "other",
        };
      });

      // Sort: in_progress first, then by deadline, then by title
      return todayMissions.sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        if (a.status === "in_progress" && b.status !== "in_progress") return -1;
        if (a.status !== "in_progress" && b.status === "in_progress") return 1;
        return a.title.localeCompare(b.title);
      });
    },
    enabled: !!user,
  });
}
