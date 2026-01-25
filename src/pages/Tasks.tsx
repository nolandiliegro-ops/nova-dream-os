import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, CheckSquare, Clock, AlertTriangle, Timer, TrendingUp, Loader2, 
  Trash2, X, Star, Target, CalendarIcon, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, useTaskStats, useCreateTask, useToggleTaskComplete, useUpdateTask, useDeleteTask, Task, Subtask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useMissions, useUpdateMission, useCreateMission, useDeleteMission, useCompleteMission, Mission } from "@/hooks/useMissions";
import { useAllMissions, useMissionStats, MissionWithContext } from "@/hooks/useAllMissions";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityConfig = {
  high: { label: "Haute", color: "text-destructive", bg: "bg-destructive/20" },
  medium: { label: "Moyenne", color: "text-segment-oracle", bg: "bg-segment-oracle/20" },
  low: { label: "Basse", color: "text-segment-consulting", bg: "bg-segment-consulting/20" },
};

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}min`;
}

export default function Tasks() {
  const { mode } = useMode();
  const [activeTab, setActiveTab] = useState<"all" | "work" | "personal">("all");
  
  // Task dialogs
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [deleteTaskConfirmOpen, setDeleteTaskConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Mission dialogs
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [deleteMissionConfirmOpen, setDeleteMissionConfirmOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<string | null>(null);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    project_id: "",
    mission_id: "",
    due_date: "",
    estimated_time: "60",
  });
  
  // Edit task form
  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    project_id: "",
    mission_id: "",
    due_date: "",
    estimated_time: "60",
    time_spent: "0",
    subtasks: [] as Subtask[],
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Mission form
  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    project_id: "",
    deadline: "",
    estimated_duration: "",
  });

  // Data hooks
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const { data: allMissions, isLoading: missionsLoading } = useAllMissions();
  const { data: projects } = useProjects();
  const { data: projectMissions } = useMissions(taskForm.project_id || undefined);
  const { data: editProjectMissions } = useMissions(editTaskForm.project_id || undefined);
  const taskStats = useTaskStats();
  const missionStats = useMissionStats();

  // Mutations
  const createTask = useCreateTask();
  const toggleTaskComplete = useToggleTaskComplete();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const completeMission = useCompleteMission();

  // Filtered data based on active tab
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    if (activeTab === "all") return allTasks;
    return allTasks.filter(t => t.mode === activeTab);
  }, [allTasks, activeTab]);

  const filteredMissions = useMemo(() => {
    if (!allMissions) return [];
    if (activeTab === "all") return allMissions;
    return allMissions.filter(m => {
      const effectiveMode = m.project_id ? m.projectMode : "work";
      return effectiveMode === activeTab;
    });
  }, [allMissions, activeTab]);

  // Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        status: "todo",
        project_id: taskForm.project_id || null,
        mission_id: taskForm.mission_id || null,
        due_date: taskForm.due_date || null,
        completed_at: null,
        estimated_time: parseInt(taskForm.estimated_time) || 60,
        time_spent: 0,
        mode: mode,
        subtasks: [],
        required_tools: [],
      });
      toast.success("Tâche créée !");
      setIsTaskDialogOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", project_id: "", mission_id: "", due_date: "", estimated_time: "60" });
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      project_id: task.project_id || "",
      mission_id: task.mission_id || "",
      due_date: task.due_date || "",
      estimated_time: task.estimated_time.toString(),
      time_spent: task.time_spent.toString(),
      subtasks: task.subtasks || [],
    });
    setNewSubtaskTitle("");
    setIsEditTaskDialogOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        title: editTaskForm.title,
        description: editTaskForm.description || null,
        priority: editTaskForm.priority,
        project_id: editTaskForm.project_id || null,
        mission_id: editTaskForm.mission_id || null,
        due_date: editTaskForm.due_date || null,
        estimated_time: parseInt(editTaskForm.estimated_time) || 60,
        time_spent: parseInt(editTaskForm.time_spent) || 0,
        subtasks: editTaskForm.subtasks,
      });
      toast.success("Tâche mise à jour !");
      setIsEditTaskDialogOpen(false);
      setEditingTask(null);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    try {
      await toggleTaskComplete.mutateAsync({ id, completed: currentStatus !== "completed" });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleTaskDateChange = async (taskId: string, date: Date | undefined) => {
    if (!date) return;
    try {
      await updateTask.mutateAsync({ id: taskId, due_date: format(date, "yyyy-MM-dd") });
      toast.success("Date mise à jour");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleTaskPriorityChange = async (taskId: string, priority: "low" | "medium" | "high") => {
    try {
      await updateTask.mutateAsync({ id: taskId, priority });
      toast.success("Priorité mise à jour");
    } catch {
      toast.error("Erreur");
    }
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setEditTaskForm({ ...editTaskForm, subtasks: [...editTaskForm.subtasks, newSubtask] });
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setEditTaskForm({
      ...editTaskForm,
      subtasks: editTaskForm.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setEditTaskForm({
      ...editTaskForm,
      subtasks: editTaskForm.subtasks.filter(s => s.id !== subtaskId),
    });
  };

  // Mission handlers
  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMission.mutateAsync({
        title: missionForm.title,
        description: missionForm.description || null,
        project_id: missionForm.project_id || null,
        status: "pending",
        order_index: 0,
        deadline: missionForm.deadline || null,
        estimated_duration: missionForm.estimated_duration || null,
        is_focus: false,
        time_spent: 0,
      });
      toast.success("Mission créée !");
      setIsMissionDialogOpen(false);
      setMissionForm({ title: "", description: "", project_id: "", deadline: "", estimated_duration: "" });
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleToggleMissionComplete = async (mission: MissionWithContext) => {
    try {
      if (mission.status === "completed") {
        await updateMission.mutateAsync({ id: mission.id, status: "pending" });
      } else {
        await completeMission.mutateAsync({ missionId: mission.id, complete: true });
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleToggleMissionFocus = async (mission: MissionWithContext) => {
    try {
      await updateMission.mutateAsync({ id: mission.id, is_focus: !mission.is_focus });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleMissionDateChange = async (missionId: string, date: Date | undefined) => {
    if (!date) return;
    try {
      await updateMission.mutateAsync({ id: missionId, deadline: format(date, "yyyy-MM-dd") });
      toast.success("Deadline mise à jour");
    } catch {
      toast.error("Erreur");
    }
  };

  // Helpers
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "Sans projet";
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Projet inconnu";
  };

  const getMissionName = (missionId: string | null) => {
    if (!missionId) return null;
    const mission = allMissions?.find(m => m.id === missionId);
    return mission?.title || null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Tâches <span className="text-gradient">& Missions</span>
            </h1>
            <p className="text-muted-foreground">
              Centre de contrôle unifié pour organiser ta vie
            </p>
          </div>
          
          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="personal">Perso</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{missionStats.focused}/{missionStats.total - missionStats.completed}</p>
                <p className="text-xs text-muted-foreground">Missions en focus</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.completed}/{taskStats.total}</p>
                <p className="text-xs text-muted-foreground">Tâches complétées</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(taskStats.totalEstimatedTime)}</p>
                <p className="text-xs text-muted-foreground">Temps estimé</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                taskStats.roi >= 0 ? "bg-segment-ecommerce/20" : "bg-destructive/20"
              )}>
                <TrendingUp className={cn("h-5 w-5", taskStats.roi >= 0 ? "text-segment-ecommerce" : "text-destructive")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", taskStats.roi >= 0 ? "text-segment-ecommerce" : "text-destructive")}>
                  {taskStats.roi >= 0 ? "+" : ""}{taskStats.roi.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">ROI Personnel</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* MISSIONS Column */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Missions
              </h3>
              <Dialog open={isMissionDialogOpen} onOpenChange={setIsMissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Mission
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer une mission</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateMission} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={missionForm.title}
                        onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                        placeholder="Ex: Refonte landing page"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Projet (optionnel)</Label>
                        <Select
                          value={missionForm.project_id || "none"}
                          onValueChange={(v) => setMissionForm({ ...missionForm, project_id: v === "none" ? "" : v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Sans projet" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sans projet</SelectItem>
                            {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Deadline</Label>
                        <Input
                          type="date"
                          value={missionForm.deadline}
                          onChange={(e) => setMissionForm({ ...missionForm, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Durée estimée</Label>
                      <Input
                        value={missionForm.estimated_duration}
                        onChange={(e) => setMissionForm({ ...missionForm, estimated_duration: e.target.value })}
                        placeholder="Ex: 2h, 3j"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={missionForm.description}
                        onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                        placeholder="Description optionnelle"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createMission.isPending}>
                      {createMission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer la mission"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {missionsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredMissions.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredMissions.map((mission) => (
                  <MissionRow
                    key={mission.id}
                    mission={mission}
                    onToggleComplete={() => handleToggleMissionComplete(mission)}
                    onToggleFocus={() => handleToggleMissionFocus(mission)}
                    onDateChange={(date) => handleMissionDateChange(mission.id, date)}
                    onDelete={() => { setMissionToDelete(mission.id); setDeleteMissionConfirmOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aucune mission. Crée-en une !
              </p>
            )}
          </GlassCard>

          {/* TASKS Column */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tâches
              </h3>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer une tâche</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        placeholder="Ex: Finaliser mockups"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priorité</Label>
                        <Select value={taskForm.priority} onValueChange={(v: typeof taskForm.priority) => setTaskForm({ ...taskForm, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="low">Basse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Temps estimé (min)</Label>
                        <Input
                          type="number"
                          value={taskForm.estimated_time}
                          onChange={(e) => setTaskForm({ ...taskForm, estimated_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Projet</Label>
                        <Select
                          value={taskForm.project_id || "none"}
                          onValueChange={(v) => setTaskForm({ ...taskForm, project_id: v === "none" ? "" : v, mission_id: "" })}
                        >
                          <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun projet</SelectItem>
                            {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Échéance</Label>
                        <Input
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    {taskForm.project_id && (
                      <div className="space-y-2">
                        <Label>Mission</Label>
                        <Select
                          value={taskForm.mission_id || "none"}
                          onValueChange={(v) => setTaskForm({ ...taskForm, mission_id: v === "none" ? "" : v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune mission</SelectItem>
                            {projectMissions?.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={createTask.isPending}>
                      {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer la tâche"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={getProjectName(task.project_id)}
                    missionName={getMissionName(task.mission_id)}
                    onToggleComplete={() => handleToggleTask(task.id, task.status)}
                    onDateChange={(date) => handleTaskDateChange(task.id, date)}
                    onPriorityChange={(p) => handleTaskPriorityChange(task.id, p)}
                    onClick={() => handleEditTaskClick(task)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aucune tâche. Crée-en une !
              </p>
            )}
          </GlassCard>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la tâche</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={editTaskForm.title} onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={editTaskForm.priority} onValueChange={(v: typeof editTaskForm.priority) => setEditTaskForm({ ...editTaskForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select
                    value={editTaskForm.project_id || "none"}
                    onValueChange={(v) => setEditTaskForm({ ...editTaskForm, project_id: v === "none" ? "" : v, mission_id: "" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet</SelectItem>
                      {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editTaskForm.project_id && (
                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Select
                    value={editTaskForm.mission_id || "none"}
                    onValueChange={(v) => setEditTaskForm({ ...editTaskForm, mission_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune mission</SelectItem>
                      {editProjectMissions?.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Échéance</Label>
                  <Input type="date" value={editTaskForm.due_date} onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Temps estimé (min)</Label>
                  <Input type="number" value={editTaskForm.estimated_time} onChange={(e) => setEditTaskForm({ ...editTaskForm, estimated_time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Temps passé (min)</Label>
                <Input type="number" value={editTaskForm.time_spent} onChange={(e) => setEditTaskForm({ ...editTaskForm, time_spent: e.target.value })} />
              </div>

              {/* Subtasks */}
              <div className="space-y-3">
                <Label>Sous-tâches</Label>
                {editTaskForm.subtasks.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {editTaskForm.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <Checkbox checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask.id)} />
                        <span className={cn("flex-1 text-sm", subtask.completed && "line-through text-muted-foreground")}>{subtask.title}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteSubtask(subtask.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une sous-tâche..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" size="icon" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editTaskForm.subtasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={(editTaskForm.subtasks.filter(s => s.completed).length / editTaskForm.subtasks.length) * 100} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{editTaskForm.subtasks.filter(s => s.completed).length}/{editTaskForm.subtasks.length}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="destructive" size="sm" onClick={() => { setTaskToDelete(editingTask?.id || null); setDeleteTaskConfirmOpen(true); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button type="submit" className="flex-1" disabled={updateTask.isPending}>
                  {updateTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Task Confirmation */}
        <AlertDialog open={deleteTaskConfirmOpen} onOpenChange={setDeleteTaskConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (taskToDelete) {
                    try {
                      await deleteTask.mutateAsync(taskToDelete);
                      toast.success("Tâche supprimée");
                      setIsEditTaskDialogOpen(false);
                      setDeleteTaskConfirmOpen(false);
                      setTaskToDelete(null);
                      setEditingTask(null);
                    } catch { toast.error("Erreur"); }
                  }
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Mission Confirmation */}
        <AlertDialog open={deleteMissionConfirmOpen} onOpenChange={setDeleteMissionConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette mission ?</AlertDialogTitle>
              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (missionToDelete) {
                    try {
                      await deleteMission.mutateAsync(missionToDelete);
                      toast.success("Mission supprimée");
                      setDeleteMissionConfirmOpen(false);
                      setMissionToDelete(null);
                    } catch { toast.error("Erreur"); }
                  }
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

// ============= SUB-COMPONENTS =============

interface MissionRowProps {
  mission: MissionWithContext;
  onToggleComplete: () => void;
  onToggleFocus: () => void;
  onDateChange: (date: Date | undefined) => void;
  onDelete: () => void;
}

function MissionRow({ mission, onToggleComplete, onToggleFocus, onDateChange, onDelete }: MissionRowProps) {
  const isCompleted = mission.status === "completed";
  
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-all hover:bg-muted/50 group",
      isCompleted && "opacity-60",
      mission.is_focus && "ring-1 ring-segment-oracle/50"
    )}>
      <Checkbox checked={isCompleted} onCheckedChange={onToggleComplete} />
      
      <button 
        onClick={onToggleFocus}
        className="shrink-0"
      >
        <Star className={cn(
          "h-4 w-4 transition-colors",
          mission.is_focus ? "fill-segment-oracle text-segment-oracle" : "text-muted-foreground hover:text-segment-oracle"
        )} />
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", isCompleted && "line-through")}>{mission.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {mission.projectName || "Sans projet"}
          {mission.totalTasks > 0 && ` • ${mission.completedTasks}/${mission.totalTasks} tâches`}
        </p>
      </div>

      {/* Progress */}
      {mission.totalTasks > 0 && (
        <Progress value={mission.progress} className="h-1.5 w-12" />
      )}

      {/* Deadline Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CalendarIcon className="h-3 w-3" />
            {mission.deadline ? format(new Date(mission.deadline), "d MMM", { locale: fr }) : "Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={mission.deadline ? new Date(mission.deadline) : undefined}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onToggleFocus}>
            <Star className="h-4 w-4 mr-2" />
            {mission.is_focus ? "Retirer du focus" : "Ajouter au focus"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  projectName: string;
  missionName: string | null;
  onToggleComplete: () => void;
  onDateChange: (date: Date | undefined) => void;
  onPriorityChange: (priority: "low" | "medium" | "high") => void;
  onClick: () => void;
}

function TaskRow({ task, projectName, missionName, onToggleComplete, onDateChange, onPriorityChange, onClick }: TaskRowProps) {
  const isCompleted = task.status === "completed";
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-4 bg-muted/30 p-3 transition-all hover:bg-muted/50 cursor-pointer group",
        task.priority === "high" ? "border-l-destructive" : 
        task.priority === "medium" ? "border-l-segment-oracle" : "border-l-segment-consulting",
        isCompleted && "opacity-60"
      )}
      onClick={onClick}
    >
      <Checkbox 
        checked={isCompleted} 
        onCheckedChange={onToggleComplete}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", isCompleted && "line-through")}>{task.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {missionName || projectName}
          {task.subtasks && task.subtasks.length > 0 && (
            <span> • {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
          )}
        </p>
      </div>

      {/* Priority Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className={cn(
            "h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
            priorityConfig[task.priority].color
          )}>
            {task.priority === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {priorityConfig[task.priority].label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onPriorityChange("high")} className="text-destructive">Haute</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriorityChange("medium")} className="text-segment-oracle">Moyenne</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriorityChange("low")} className="text-segment-consulting">Basse</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {task.due_date ? format(new Date(task.due_date), "d MMM", { locale: fr }) : "Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={task.due_date ? new Date(task.due_date) : undefined}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
