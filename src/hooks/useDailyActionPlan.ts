import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export interface EnrichedTask {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  estimatedTime: number; // minutes
  timeSpent: number;
  requiredTools: string[];
  dueDate: string | null;
  
  // Mission enrichment
  missionId: string | null;
  missionTitle: string | null;
  
  // Project enrichment
  projectId: string | null;
  projectName: string | null;
  projectSegment: string | null;
}

export interface TaskGroup {
  groupKey: string; // missionId or "independent"
  missionTitle: string | null;
  projectName: string | null;
  projectSegment: string | null;
  tasks: EnrichedTask[];
  totalMinutes: number;
  completedMinutes: number;
}

export interface DailyActionPlan {
  tasks: EnrichedTask[];
  groups: TaskGroup[];
  totalMinutes: number;
  completedMinutes: number;
  progress: number;
  taskCount: number;
  completedCount: number;
  isOverloaded: boolean;
}

export function useDailyActionPlan(mode: "work" | "personal", dailyCapacity: number) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: rawTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["daily-tasks", mode, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("mode", mode)
        .eq("due_date", today)
        .order("priority", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get unique mission IDs
  const missionIds = useMemo(() => {
    if (!rawTasks) return [];
    return [...new Set(rawTasks.filter(t => t.mission_id).map(t => t.mission_id as string))];
  }, [rawTasks]);

  // Fetch missions
  const { data: missions } = useQuery({
    queryKey: ["missions-for-daily", missionIds],
    queryFn: async () => {
      if (missionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("missions")
        .select("id, title, project_id")
        .in("id", missionIds);
      if (error) throw error;
      return data || [];
    },
    enabled: missionIds.length > 0,
  });

  // Get unique project IDs (from tasks and missions)
  const projectIds = useMemo(() => {
    if (!rawTasks) return [];
    const fromTasks = rawTasks.filter(t => t.project_id).map(t => t.project_id as string);
    const fromMissions = (missions || []).filter(m => m.project_id).map(m => m.project_id as string);
    return [...new Set([...fromTasks, ...fromMissions])];
  }, [rawTasks, missions]);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects-for-daily", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, segment")
        .in("id", projectIds);
      if (error) throw error;
      return data || [];
    },
    enabled: projectIds.length > 0,
  });

  // Build the enriched action plan
  const actionPlan = useMemo((): DailyActionPlan => {
    if (!rawTasks) {
      return {
        tasks: [],
        groups: [],
        totalMinutes: 0,
        completedMinutes: 0,
        progress: 0,
        taskCount: 0,
        completedCount: 0,
        isOverloaded: false,
      };
    }

    const missionsMap = new Map((missions || []).map(m => [m.id, m]));
    const projectsMap = new Map((projects || []).map(p => [p.id, p]));

    // Enrich tasks
    const enrichedTasks: EnrichedTask[] = rawTasks.map(task => {
      const mission = task.mission_id ? missionsMap.get(task.mission_id) : null;
      const projectId = task.project_id || mission?.project_id || null;
      const project = projectId ? projectsMap.get(projectId) : null;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as "todo" | "in_progress" | "completed",
        priority: task.priority as "low" | "medium" | "high",
        estimatedTime: task.estimated_time || 0,
        timeSpent: task.time_spent || 0,
        requiredTools: Array.isArray(task.required_tools) ? task.required_tools as string[] : [],
        dueDate: task.due_date,
        missionId: task.mission_id,
        missionTitle: mission?.title || null,
        projectId: projectId,
        projectName: project?.name || null,
        projectSegment: project?.segment || null,
      };
    });

    // Sort: in_progress first, then by priority (high > medium > low), then by title
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    enrichedTasks.sort((a, b) => {
      // Completed tasks at the end
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      // In progress first
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;
      // Then by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Group tasks by mission
    const groupsMap = new Map<string, TaskGroup>();

    enrichedTasks.forEach(task => {
      const groupKey = task.missionId || "independent";
      
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          groupKey,
          missionTitle: task.missionTitle,
          projectName: task.projectName,
          projectSegment: task.projectSegment,
          tasks: [],
          totalMinutes: 0,
          completedMinutes: 0,
        });
      }

      const group = groupsMap.get(groupKey)!;
      group.tasks.push(task);
      group.totalMinutes += task.estimatedTime;
      if (task.status === "completed") {
        group.completedMinutes += task.estimatedTime;
      }
    });

    // Convert to array and sort (mission groups first, independent last)
    const groups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.groupKey === "independent") return 1;
      if (b.groupKey === "independent") return -1;
      return 0;
    });

    // Calculate totals
    const totalMinutes = enrichedTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    const completedMinutes = enrichedTasks
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + t.estimatedTime, 0);
    const completedCount = enrichedTasks.filter(t => t.status === "completed").length;

    return {
      tasks: enrichedTasks,
      groups,
      totalMinutes,
      completedMinutes,
      progress: totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0,
      taskCount: enrichedTasks.length,
      completedCount,
      isOverloaded: totalMinutes > dailyCapacity,
    };
  }, [rawTasks, missions, projects, dailyCapacity]);

  return {
    data: actionPlan,
    isLoading: tasksLoading,
  };
}
