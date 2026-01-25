import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Plus,
  Timer,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Wrench,
  X,
  Pencil,
  Target,
} from "lucide-react";
import { Mission, MissionWithProgress, formatMinutesToDisplay } from "@/hooks/useMissions";
import { Task, useTasksByMission, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { toast } from "sonner";

interface MissionWorkspaceDialogProps {
  mission: Mission | MissionWithProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
}

const priorityConfig = {
  low: { label: "Basse", color: "bg-muted text-muted-foreground" },
  medium: { label: "Moyenne", color: "bg-segment-oracle/20 text-segment-oracle" },
  high: { label: "Haute", color: "bg-destructive/20 text-destructive" },
};

const COMMON_TOOLS = ["Figma", "VS Code", "Chrome", "Notion", "Slack", "Terminal", "Postman", "GitHub"];

export function MissionWorkspaceDialog({ 
  mission, 
  open, 
  onOpenChange,
  projectId,
}: MissionWorkspaceDialogProps) {
  const { data: tasks, isLoading } = useTasksByMission(mission?.id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // New task form state
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: null as Date | null,
    estimated_time: 60,
    priority: "medium" as "low" | "medium" | "high",
    required_tools: [] as string[],
  });
  const [toolInput, setToolInput] = useState("");
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, progress: 0, totalTime: 0, completedTime: 0 };
    
    const completed = tasks.filter(t => t.status === "completed").length;
    const totalTime = tasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
    const completedTime = tasks.filter(t => t.status === "completed")
      .reduce((sum, t) => sum + (t.estimated_time || 0), 0);
    
    return {
      total: tasks.length,
      completed,
      progress: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
      totalTime,
      completedTime,
    };
  }, [tasks]);

  const handleAddTool = (tool: string) => {
    if (tool && !newTask.required_tools.includes(tool)) {
      setNewTask(prev => ({
        ...prev,
        required_tools: [...prev.required_tools, tool],
      }));
    }
    setToolInput("");
  };

  const handleRemoveTool = (tool: string) => {
    setNewTask(prev => ({
      ...prev,
      required_tools: prev.required_tools.filter(t => t !== tool),
    }));
  };

  const handleCreateTask = async () => {
    if (!mission || !newTask.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        due_date: newTask.due_date ? format(newTask.due_date, "yyyy-MM-dd") : null,
        estimated_time: newTask.estimated_time,
        priority: newTask.priority,
        status: "todo",
        mode: "work",
        project_id: projectId || null,
        mission_id: mission.id,
        time_spent: 0,
        completed_at: null,
        subtasks: [],
        required_tools: newTask.required_tools,
      });

      toast.success("Tâche créée !");
      setNewTask({
        title: "",
        description: "",
        due_date: null,
        estimated_time: 60,
        priority: "medium",
        required_tools: [],
      });
      setShowForm(false);
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleToggleTaskComplete = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: task.status === "completed" ? "todo" : "completed",
        completed_at: task.status === "completed" ? null : new Date().toISOString(),
      });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Tâche supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-trading text-xl truncate">
                {mission.title}
              </DialogTitle>
              {mission.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {mission.description}
                </p>
              )}
            </div>
            {mission.deadline && (
              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(mission.deadline), "d MMM", { locale: fr })}
              </Badge>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-trading text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">tâches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-trading text-segment-ecommerce">{Math.round(stats.progress)}%</div>
              <div className="text-xs text-muted-foreground">complété</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-trading">{formatMinutesToDisplay(stats.totalTime)}</div>
              <div className="text-xs text-muted-foreground">estimé</div>
            </div>
          </div>
          
          <Progress 
            value={stats.progress} 
            className="h-2 mt-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-segment-ecommerce" 
          />
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {/* Add Task Button */}
          {!showForm && (
            <Button
              variant="outline"
              className="w-full mb-4 border-dashed"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une tâche
            </Button>
          )}

          {/* New Task Form */}
          {showForm && (
            <div className="glass-card rounded-2xl p-4 mb-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Nouvelle tâche
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Titre</Label>
                  <Input
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Créer les wireframes"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Description (optionnel)</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Détails de la tâche..."
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Due Date */}
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-1 justify-start text-left font-normal h-9"
                        >
                          <CalendarDays className="h-3 w-3 mr-2" />
                          {newTask.due_date 
                            ? format(newTask.due_date, "d MMM", { locale: fr })
                            : "Choisir"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTask.due_date || undefined}
                          onSelect={(date) => {
                            setNewTask(prev => ({ ...prev, due_date: date || null }));
                            setDueDateOpen(false);
                          }}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label className="text-xs">Durée (min)</Label>
                    <Input
                      type="number"
                      value={newTask.estimated_time}
                      onChange={e => setNewTask(prev => ({ 
                        ...prev, 
                        estimated_time: parseInt(e.target.value) || 0 
                      }))}
                      min={5}
                      step={5}
                      className="mt-1 h-9"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <Label className="text-xs">Priorité</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask(prev => ({ 
                        ...prev, 
                        priority: v as "low" | "medium" | "high" 
                      }))}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Outils requis
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_TOOLS.filter(t => !newTask.required_tools.includes(t)).map(tool => (
                      <Badge
                        key={tool}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 text-xs"
                        onClick={() => handleAddTool(tool)}
                      >
                        + {tool}
                      </Badge>
                    ))}
                  </div>
                  {newTask.required_tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTask.required_tools.map(tool => (
                        <Badge
                          key={tool}
                          className="bg-primary/20 text-primary cursor-pointer text-xs"
                          onClick={() => handleRemoveTool(tool)}
                        >
                          {tool} <X className="h-2.5 w-2.5 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTask} disabled={createTask.isPending}>
                  {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer la tâche
                </Button>
              </div>
            </div>
          )}

          {/* Task List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks
                .sort((a, b) => {
                  // Completed at bottom
                  if (a.status === "completed" && b.status !== "completed") return 1;
                  if (a.status !== "completed" && b.status === "completed") return -1;
                  // Then by due_date
                  if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  if (a.due_date && !b.due_date) return -1;
                  if (!a.due_date && b.due_date) return 1;
                  return 0;
                })
                .map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleTaskComplete(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              }
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche pour cette mission</p>
              <p className="text-xs mt-1">Ajoute des tâches pour suivre ta progression</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Task Row Component
interface TaskRowProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
}

function TaskRow({ task, onToggleComplete, onDelete }: TaskRowProps) {
  const isCompleted = task.status === "completed";
  const priorityConf = priorityConfig[task.priority];
  const requiredTools = (task as any).required_tools as string[] || [];

  return (
    <div className={cn(
      "group flex items-start gap-3 p-3 rounded-xl transition-all",
      isCompleted ? "bg-segment-ecommerce/10" : "bg-muted/50 hover:bg-muted"
    )}>
      <button
        onClick={onToggleComplete}
        className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-segment-ecommerce" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-medium text-sm",
            isCompleted && "line-through opacity-60"
          )}>
            {task.title}
          </span>
          <Badge className={cn("text-[10px] px-1.5 py-0", priorityConf.color)}>
            {priorityConf.label}
          </Badge>
        </div>

        {task.description && (
          <p className={cn(
            "text-xs text-muted-foreground mt-0.5 line-clamp-1",
            isCompleted && "opacity-50"
          )}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.due_date), "d MMM", { locale: fr })}
            </span>
          )}
          {task.estimated_time > 0 && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {formatMinutesToDisplay(task.estimated_time)}
            </span>
          )}
          {requiredTools.length > 0 && (
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {requiredTools.slice(0, 2).join(", ")}
              {requiredTools.length > 2 && ` +${requiredTools.length - 2}`}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
