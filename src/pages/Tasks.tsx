import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckSquare, Clock, AlertTriangle, Timer, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, useTaskStats, useCreateTask, useToggleTaskComplete, useUpdateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    project_id: "",
    due_date: "",
    estimated_time: "60",
  });

  const { data: tasks, isLoading } = useTasks(mode);
  const { data: projects } = useProjects(mode);
  const stats = useTaskStats(mode);
  const createTask = useCreateTask();
  const toggleComplete = useToggleTaskComplete();
  const updateTask = useUpdateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: "todo",
        project_id: formData.project_id || null,
        due_date: formData.due_date || null,
        completed_at: null,
        estimated_time: parseInt(formData.estimated_time) || 60,
        time_spent: 0,
        mode: mode,
      });
      
      toast.success("Tâche créée !");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        project_id: "",
        due_date: "",
        estimated_time: "60",
      });
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await toggleComplete.mutateAsync({
        id,
        completed: currentStatus !== "completed",
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Group tasks by project
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "Sans projet";
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Projet inconnu";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Tâches <span className="text-gradient">& ROI</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Optimise ton temps pour maximiser les résultats" : "Tes tâches personnelles"}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une tâche</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Finaliser landing page"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: typeof formData.priority) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_time">Temps estimé (min)</Label>
                    <Input
                      id="estimated_time"
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Projet</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun projet</SelectItem>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Échéance</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={createTask.isPending}>
                  {createTask.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Créer la tâche"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats with ROI */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
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
                <p className="text-2xl font-bold">{formatTime(stats.totalEstimatedTime)}</p>
                <p className="text-xs text-muted-foreground">Temps estimé total</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-oracle/20">
                <Clock className="h-5 w-5 text-segment-oracle" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
                <p className="text-xs text-muted-foreground">Temps passé</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                stats.roi >= 0 ? "bg-segment-ecommerce/20" : "bg-destructive/20"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5",
                  stats.roi >= 0 ? "text-segment-ecommerce" : "text-destructive"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.roi >= 0 ? "text-segment-ecommerce" : "text-destructive"
                )}>
                  {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">ROI Personnel</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tasks List */}
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold">Toutes les tâches</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                    task.priority === "high" ? "border-l-destructive" : 
                    task.priority === "medium" ? "border-l-segment-oracle" : "border-l-segment-consulting",
                    task.status === "completed" && "opacity-60"
                  )}
                >
                  <Checkbox 
                    checked={task.status === "completed"} 
                    onCheckedChange={() => handleToggle(task.id, task.status)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium", task.status === "completed" && "line-through")}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{getProjectName(task.project_id)}</p>
                  </div>
                  
                  {/* Time tracking */}
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      <span>{formatTime(task.time_spent)}</span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{formatTime(task.estimated_time)}</span>
                  </div>
                  
                  {/* Priority badge */}
                  <div className={cn(
                    "hidden sm:flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                    priorityConfig[task.priority].bg,
                    priorityConfig[task.priority].color
                  )}>
                    {task.priority === "high" && <AlertTriangle className="h-3 w-3" />}
                    <span>{priorityConfig[task.priority].label}</span>
                  </div>
                  
                  {/* Due date */}
                  {task.due_date && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune tâche pour le moment.<br />
              <span className="text-sm">Clique sur "Nouvelle tâche" pour commencer.</span>
            </p>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
