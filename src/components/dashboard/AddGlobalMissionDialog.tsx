import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarIcon } from "lucide-react";
import { useCreateMission } from "@/hooks/useMissions";
import { useProjects } from "@/hooks/useProjects";
import { useMode } from "@/contexts/ModeContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  other: "Autre",
};

const segmentColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce/20 text-segment-ecommerce",
  tiktok: "bg-segment-tiktok/20 text-segment-tiktok",
  consulting: "bg-segment-consulting/20 text-segment-consulting",
  oracle: "bg-segment-oracle/20 text-segment-oracle",
  data: "bg-segment-data/20 text-segment-data",
  tech: "bg-segment-tech/20 text-segment-tech",
  other: "bg-muted/20 text-muted-foreground",
};

interface AddGlobalMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGlobalMissionDialog({ open, onOpenChange }: AddGlobalMissionDialogProps) {
  const { mode } = useMode();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  
  const { data: projects, isLoading: projectsLoading } = useProjects(mode);
  const createMission = useCreateMission();

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    try {
      await createMission.mutateAsync({
        project_id: selectedProjectId,
        title: title.trim(),
        description: description.trim() || null,
        status: "pending",
        order_index: 0,
        deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      });

      toast.success("Mission créée !");
      setTitle("");
      setDescription("");
      setSelectedProjectId("");
      setDeadline(undefined);
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedProjectId("");
    setDeadline(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-trading">Nouvelle Mission Globale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label htmlFor="project-select">Projet de destination</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Sélectionner un projet..." />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          segmentColors[project.segment] || segmentColors.other
                        )}>
                          {segmentLabels[project.segment] || "Autre"}
                        </span>
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Aucun projet disponible
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedProject && (
              <p className="text-xs text-muted-foreground">
                Segment: {segmentLabels[selectedProject.segment] || "Autre"}
              </p>
            )}
          </div>

          {/* Mission Title */}
          <div className="space-y-2">
            <Label htmlFor="mission-title">Titre de la mission</Label>
            <Input
              id="mission-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Phase de lancement"
              className="rounded-2xl"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="mission-description">Description (optionnel)</Label>
            <Textarea
              id="mission-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris les objectifs de cette mission..."
              className="rounded-2xl resize-none"
              rows={2}
            />
          </div>

          {/* Deadline Date Picker */}
          <div className="space-y-2">
            <Label>Deadline (optionnel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-trading rounded-2xl",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-2xl" 
            disabled={createMission.isPending || !title.trim() || !selectedProjectId}
          >
            {createMission.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Créer la mission"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
