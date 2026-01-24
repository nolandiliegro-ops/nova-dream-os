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

export type MissionInsert = Omit<Mission, "id" | "created_at" | "updated_at">;

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
  });
}

export function useMissionsWithProgress(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["missions", "withProgress", projectId],
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
