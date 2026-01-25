import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2, Zap, Timer } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useMissions } from "@/hooks/useMissions";
import { useMode } from "@/contexts/ModeContext";
import { toast } from "sonner";

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTaskDialog({ open, onOpenChange }: QuickTaskDialogProps) {
  const { mode } = useMode();
  const { data: projects } = useProjects(mode);
  const createTask = useCreateTask();
  
  const [form, setForm] = useState({
    title: "",
    due_date: new Date(), // Default to today
    estimated_time: 30,
    project_id: "",
    mission_id: "",
  });
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Get missions for selected project
  const { data: missions } = useMissions(form.project_id || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: form.title.trim(),
        description: null,
        priority: "medium",
        status: "todo",
        project_id: form.project_id || null,
        mission_id: form.mission_id || null,
        due_date: format(form.due_date, "yyyy-MM-dd"),
        estimated_time: form.estimated_time,
        time_spent: 0,
        completed_at: null,
        mode,
        subtasks: [],
        required_tools: [],
      });
      
      toast.success("⚡ Tâche flash créée !");
      onOpenChange(false);
      setForm({
        title: "",
        due_date: new Date(),
        estimated_time: 30,
        project_id: "",
        mission_id: "",
      });
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-segment-oracle" />
            Tâche Flash
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label>Titre</Label>
            <Input
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Répondre aux emails"
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Date & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <Label className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Date
              </Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {format(form.due_date, "d MMM", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.due_date}
                    onSelect={(date) => {
                      if (date) setForm(prev => ({ ...prev, due_date: date }));
                      setDueDateOpen(false);
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration */}
            <div>
              <Label className="flex items-center gap-1">
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
                className="mt-1"
              />
            </div>
          </div>

          {/* Project & Mission Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <Label>Projet (optionnel)</Label>
              <Select
                value={form.project_id || "none"}
                onValueChange={(v) => setForm(prev => ({ 
                  ...prev, 
                  project_id: v === "none" ? "" : v,
                  mission_id: "" // Reset mission when project changes
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mission */}
            <div>
              <Label>Mission (optionnel)</Label>
              <Select
                value={form.mission_id || "none"}
                onValueChange={(v) => setForm(prev => ({ 
                  ...prev, 
                  mission_id: v === "none" ? "" : v 
                }))}
                disabled={!form.project_id}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {missions?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
