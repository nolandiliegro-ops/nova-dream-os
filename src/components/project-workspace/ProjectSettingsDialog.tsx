import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Save, Trash2 } from "lucide-react";
import { Project, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useSegments, ICON_MAP } from "@/hooks/useSegments";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
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

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Projet supprimé avec succès");
      onOpenChange(false);
      navigate("/projects");
    } catch {
      toast.error("Erreur lors de la suppression du projet");
    }
  };

  return (
    <>
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

            {/* Delete Section */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le projet
              </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera également toutes les missions et tâches associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
