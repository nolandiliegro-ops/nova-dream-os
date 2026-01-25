import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Timer,
  Trash2,
  Loader2,
  Wrench,
  X,
  CheckCircle2,
  Circle,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Task, Subtask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { formatMinutesToDisplay } from "@/hooks/useMissions";
import { toast } from "sonner";
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

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityConfig = {
  low: { label: "Basse", color: "bg-muted text-muted-foreground" },
  medium: { label: "Moyenne", color: "bg-segment-oracle/20 text-segment-oracle" },
  high: { label: "Haute", color: "bg-destructive/20 text-destructive" },
};

const COMMON_TOOLS = ["Figma", "VS Code", "Chrome", "Notion", "Slack", "Terminal", "Postman", "GitHub", "Excel", "Photoshop"];

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: null as Date | null,
    estimated_time: 60,
    required_tools: [] as string[],
    subtasks: [] as Subtask[],
    status: "todo" as "todo" | "in_progress" | "completed",
  });

  // Sync form with task when it changes
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null,
        estimated_time: task.estimated_time || 60,
        required_tools: task.required_tools || [],
        subtasks: task.subtasks || [],
        status: task.status,
      });
    }
  }, [task]);

  const handleAddTool = (tool: string) => {
    if (tool && !form.required_tools.includes(tool)) {
      setForm(prev => ({
        ...prev,
        required_tools: [...prev.required_tools, tool],
      }));
    }
  };

  const handleRemoveTool = (tool: string) => {
    setForm(prev => ({
      ...prev,
      required_tools: prev.required_tools.filter(t => t !== tool),
    }));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubtask],
    }));
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => 
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
    }));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== subtaskId),
    }));
  };

  const handleSave = async () => {
    if (!task || !form.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        due_date: form.due_date ? format(form.due_date, "yyyy-MM-dd") : null,
        estimated_time: form.estimated_time,
        required_tools: form.required_tools,
        subtasks: form.subtasks,
        status: form.status,
      });
      toast.success("Tâche mise à jour !");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tâche supprimée");
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleComplete = () => {
    setForm(prev => ({
      ...prev,
      status: prev.status === "completed" ? "todo" : "completed",
    }));
  };

  if (!task) return null;

  const completedSubtasks = form.subtasks.filter(s => s.completed).length;
  const totalSubtasks = form.subtasks.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleComplete}
                className="flex-shrink-0 transition-transform hover:scale-110"
              >
                {form.status === "completed" ? (
                  <CheckCircle2 className="h-6 w-6 text-segment-ecommerce" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <DialogTitle className={cn(
                "font-trading text-lg",
                form.status === "completed" && "line-through opacity-60"
              )}>
                {task.title}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Title */}
            <div>
              <Label className="text-xs">Titre</Label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Notes, détails..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Row: Date, Duration, Priority */}
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
                      {form.due_date 
                        ? format(form.due_date, "d MMM", { locale: fr })
                        : "Choisir"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.due_date || undefined}
                      onSelect={(date) => {
                        setForm(prev => ({ ...prev, due_date: date || null }));
                        setDueDateOpen(false);
                      }}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Durée (min)
                </Label>
                <Input
                  type="number"
                  value={form.estimated_time}
                  onChange={e => setForm(prev => ({ 
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
                <Label className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Priorité
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm(prev => ({ 
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
                {COMMON_TOOLS.filter(t => !form.required_tools.includes(t)).map(tool => (
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
              {form.required_tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.required_tools.map(tool => (
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

            {/* Subtasks */}
            <div>
              <Label className="text-xs flex items-center gap-1">
                Sous-tâches
                {totalSubtasks > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({completedSubtasks}/{totalSubtasks})
                  </span>
                )}
              </Label>
              
              {/* Subtask list */}
              {form.subtasks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.subtasks.map(subtask => (
                    <div 
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                      />
                      <span className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through opacity-60"
                      )}>
                        {subtask.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add subtask */}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  placeholder="Nouvelle sous-tâche..."
                  className="h-8 text-sm"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>⏱️ Estimé : {formatMinutesToDisplay(form.estimated_time)}</span>
              <span>📅 Passé : {formatMinutesToDisplay(task.time_spent)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateTask.isPending}>
                {updateTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche "{task?.title}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
