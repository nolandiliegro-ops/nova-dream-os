import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  segment: "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other";
  status: "planned" | "in_progress" | "completed" | "on_hold";
  progress: number;
  deadline: string | null;
  mode: "work" | "personal";
  budget: number | null;
  revenue_generated: number | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;

// 1 minute staleTime for optimized caching during navigation
const STALE_TIME_1_MIN = 60 * 1000;

export function useProjects(mode?: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["projects", mode],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (mode) {
        query = query.eq("mode", mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
    staleTime: STALE_TIME_1_MIN,
  });
}

export function useProject(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!user && !!projectId,
    staleTime: STALE_TIME_1_MIN,
  });
}

export function useProjectStats(mode?: "work" | "personal") {
  const { data: projects } = useProjects(mode);

  const stats = {
    total: 0,
    inProgress: 0,
    completed: 0,
    planned: 0,
    onHold: 0,
    bySegment: {} as Record<string, number>,
  };

  if (projects) {
    stats.total = projects.length;
    projects.forEach((p) => {
      if (p.status === "in_progress") stats.inProgress++;
      if (p.status === "completed") stats.completed++;
      if (p.status === "planned") stats.planned++;
      if (p.status === "on_hold") stats.onHold++;
      stats.bySegment[p.segment] = (stats.bySegment[p.segment] || 0) + 1;
    });
  }

  return stats;
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: Omit<ProjectInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Hook to get projects with urgent deadlines (within specified hours)
export function useUrgentDeadlines(hoursThreshold: number = 48, mode?: "work" | "personal") {
  const { data: projects } = useProjects(mode);

  const urgentProjects = useMemo(() => {
    if (!projects) return [];

    const now = new Date();
    const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);

    return projects
      .filter((p) => {
        if (!p.deadline || p.status === "completed") return false;
        const deadlineDate = new Date(p.deadline);
        return deadlineDate <= threshold && deadlineDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      });
  }, [projects, hoursThreshold]);

  return {
    urgentProjects,
    count: urgentProjects.length,
    hasUrgent: urgentProjects.length > 0,
  };
}

// Hook to get the next deadline project (closest deadline)
export function useNextDeadline(mode?: "work" | "personal") {
  const { data: projects } = useProjects(mode);

  const nextDeadlineProject = useMemo(() => {
    if (!projects) return null;

    const now = new Date();
    const projectsWithDeadlines = projects
      .filter((p) => {
        if (!p.deadline || p.status === "completed") return false;
        const deadlineDate = new Date(p.deadline);
        return deadlineDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      });

    return projectsWithDeadlines[0] || null;
  }, [projects]);

  return nextDeadlineProject;
}
