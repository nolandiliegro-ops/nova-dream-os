import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { Project, useUpdateProject } from "@/hooks/useProjects";
import { useSegments, getSegmentIcon, ICON_MAP } from "@/hooks/useSegments";
import { toast } from "sonner";

interface ProjectSettingsDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hourlyRate: number;
  onHourlyRateChange: (rate: number) => void;
}

export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange,
  hourlyRate,
  onHourlyRateChange,
}: ProjectSettingsDialogProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    segment: project.segment,
    description: project.description || "",
    budget: project.budget?.toString() || "",
    deadline: project.deadline || "",
  });
  const [localHourlyRate, setLocalHourlyRate] = useState(hourlyRate.toString());

  const updateProject = useUpdateProject();
  const { data: segments } = useSegments(project.mode as "work" | "personal");

  // Sync form data when project changes
  useEffect(() => {
    setFormData({
      name: project.name,
      segment: project.segment,
      description: project.description || "",
      budget: project.budget?.toString() || "",
      deadline: project.deadline || "",
    });
  }, [project]);

  useEffect(() => {
    setLocalHourlyRate(hourlyRate.toString());
  }, [hourlyRate]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: formData.name.trim(),
        segment: formData.segment as Project["segment"],
        description: formData.description || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        deadline: formData.deadline || null,
      });

      // Update hourly rate (stored locally)
      const newRate = parseFloat(localHourlyRate) || 50;
      onHourlyRateChange(newRate);
      localStorage.setItem(`project-hourly-rate-${project.id}`, newRate.toString());

      toast.success("Projet mis à jour !");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Paramètres du projet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du projet..."
            />
          </div>

          {/* Segment */}
          <div className="space-y-2">
            <Label>Segment</Label>
            <Select
              value={formData.segment}
              onValueChange={(value) => setFormData({ ...formData, segment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {segments?.map((seg) => {
                  const Icon = ICON_MAP[seg.icon];
                  return (
                    <SelectItem key={seg.id} value={seg.slug}>
                      <div className="flex items-center gap-2">
                        {Icon && (
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center"
                            style={{ backgroundColor: seg.color }}
                          >
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {seg.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>

          {/* Budget & Hourly Rate Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (€)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Taux horaire (€/h)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={localHourlyRate}
                onChange={(e) => setLocalHourlyRate(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateProject.isPending}>
            {updateProject.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
