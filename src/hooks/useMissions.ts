import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "./useTasks";

export interface Mission {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
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
        // Filter: missions with progress between 1-99% OR with in_progress tasks
        .filter((m) => (m.progress > 0 && m.progress < 100) || m.inProgressTasksCount > 0)
        // Sort by in_progress tasks count (desc), then by progress (desc)
        .sort((a, b) => {
          if (b.inProgressTasksCount !== a.inProgressTasksCount) {
            return b.inProgressTasksCount - a.inProgressTasksCount;
          }
          return b.progress - a.progress;
        })
        // Take top 3
        .slice(0, 3);

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
