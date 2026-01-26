import { useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentProgress } from "@/components/ui/segment-progress";
import { 
  Info, 
  Pencil, 
  Save, 
  X, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, useUpdateProject } from "@/hooks/useProjects";
import { toast } from "sonner";

interface ProjectInfoWidgetProps {
  project: Project;
}

const statusConfig = {
  planned: { label: "Planifié", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", color: "bg-primary/20 text-primary" },
  completed: { label: "Terminé", color: "bg-segment-ecommerce/20 text-segment-ecommerce" },
  on_hold: { label: "En pause", color: "bg-segment-oracle/20 text-segment-oracle" },
};

export function ProjectInfoWidget({ project }: ProjectInfoWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: project.description || "",
    status: project.status,
    deadline: project.deadline || "",
    budget: project.budget?.toString() || "",
    progress: project.progress,
  });

  const updateProject = useUpdateProject();

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        description: formData.description || null,
        status: formData.status,
        deadline: formData.deadline || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        progress: formData.progress,
      });
      toast.success("Projet mis à jour !");
      setIsEditing(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCancel = () => {
    setFormData({
      description: project.description || "",
      status: project.status,
      deadline: project.deadline || "",
      budget: project.budget?.toString() || "",
      progress: project.progress,
    });
    setIsEditing(false);
  };

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Informations</h3>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              disabled={updateProject.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Project["status"]) => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="on_hold">En pause</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Budget (€)</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Progression ({formData.progress}%)</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary mt-3"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Badge */}
          <div>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              statusConfig[project.status].color
            )}>
              {statusConfig[project.status].label}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {project.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
              </div>
            )}

            {project.budget !== null && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{project.budget.toLocaleString('fr-FR')}€</span>
              </div>
            )}

            {project.revenue_generated !== null && project.revenue_generated > 0 && (
              <div className="flex items-center gap-2 text-sm text-segment-ecommerce">
                <TrendingUp className="h-4 w-4" />
                <span>+{project.revenue_generated.toLocaleString('fr-FR')}€</span>
              </div>
            )}
          </div>

          {/* Progress Bar - using SegmentProgress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <SegmentProgress 
              value={project.progress} 
              segment={project.segment} 
              size="md"
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
