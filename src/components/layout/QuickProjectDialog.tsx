import { useState, useEffect } from "react";
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
import { CalendarDays, Loader2, FolderKanban } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { useSegments, ICON_MAP } from "@/hooks/useSegments";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface QuickProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickProjectDialog({ open, onOpenChange }: QuickProjectDialogProps) {
  const { mode } = useMode();
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const { data: segments } = useSegments(mode);
  
  const [form, setForm] = useState({
    name: "",
    segment: "",
    deadline: null as Date | null,
  });
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  // Set default segment when segments load
  useEffect(() => {
    if (segments && segments.length > 0 && !form.segment) {
      setForm(prev => ({ ...prev, segment: segments[0].slug }));
    }
  }, [segments, form.segment]);

  // Reset segment when mode changes
  useEffect(() => {
    if (segments && segments.length > 0) {
      setForm(prev => ({ ...prev, segment: segments[0].slug }));
    }
  }, [mode, segments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      const newProject = await createProject.mutateAsync({
        name: form.name.trim(),
        description: null,
        segment: form.segment,
        status: "planned",
        progress: 0,
        deadline: form.deadline ? format(form.deadline, "yyyy-MM-dd") : null,
        mode,
        budget: null,
        revenue_generated: 0,
      });
      
      toast.success("🎯 Projet créé !");
      onOpenChange(false);
      setForm({
        name: "",
        segment: segments?.[0]?.slug || "",
        deadline: null,
      });
      
      // Navigate to the new project
      navigate(`/projects/${newProject.id}`);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-segment-ecommerce" />
            Nouveau Projet
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label>Nom du projet</Label>
            <Input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Refonte site e-commerce"
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Segment & Deadline Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Segment */}
            <div>
              <Label>Segment</Label>
              <Select
                value={form.segment}
                onValueChange={(v) => setForm(prev => ({ ...prev, segment: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments?.map(s => {
                    const Icon = ICON_MAP[s.icon];
                    return (
                      <SelectItem key={s.id} value={s.slug}>
                        <div className="flex items-center gap-2">
                          {Icon && (
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center"
                              style={{ backgroundColor: s.color }}
                            >
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {s.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div>
              <Label className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Deadline
              </Label>
              <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start text-left font-normal"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {form.deadline 
                      ? format(form.deadline, "d MMM", { locale: fr })
                      : "Optionnel"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.deadline || undefined}
                    onSelect={(date) => {
                      setForm(prev => ({ ...prev, deadline: date || null }));
                      setDeadlineOpen(false);
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le projet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
