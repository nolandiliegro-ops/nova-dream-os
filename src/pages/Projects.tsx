import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useProjectStats, useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { toast } from "sonner";

const segments = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "tiktok", label: "TikTok" },
  { value: "consulting", label: "Consulting" },
  { value: "oracle", label: "Oracle" },
  { value: "data", label: "Les Enquêtes" },
  { value: "tech", label: "Dream App" },
  { value: "other", label: "Autre" },
];

const segmentColors: Record<string, string> = {
  ecommerce: "border-segment-ecommerce text-segment-ecommerce",
  tiktok: "border-segment-tiktok text-segment-tiktok",
  consulting: "border-segment-consulting text-segment-consulting",
  oracle: "border-segment-oracle text-segment-oracle",
  data: "border-segment-data text-segment-data",
  tech: "border-segment-tech text-segment-tech",
  other: "border-muted-foreground text-muted-foreground",
};

const segmentBgColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce/20",
  tiktok: "bg-segment-tiktok/20",
  consulting: "bg-segment-consulting/20",
  oracle: "bg-segment-oracle/20",
  data: "bg-segment-data/20",
  tech: "bg-segment-tech/20",
  other: "bg-muted",
};

const statusConfig = {
  planned: { label: "Planifié", icon: Clock, color: "text-muted-foreground" },
  in_progress: { label: "En cours", icon: AlertCircle, color: "text-primary" },
  completed: { label: "Terminé", icon: CheckCircle2, color: "text-segment-ecommerce" },
  on_hold: { label: "En pause", icon: Clock, color: "text-segment-oracle" },
};

export default function Projects() {
  const { mode } = useMode();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<typeof projects extends (infer T)[] | undefined ? T | null : never>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    segment: "ecommerce" as "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other",
    status: "planned" as "planned" | "in_progress" | "completed" | "on_hold",
    deadline: "",
    budget: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    segment: "ecommerce" as "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other",
    status: "planned" as "planned" | "in_progress" | "completed" | "on_hold",
    deadline: "",
    budget: "",
  });

  const { data: projects, isLoading } = useProjects(mode);
  const stats = useProjectStats(mode);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProject.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        segment: formData.segment,
        status: formData.status,
        progress: 0,
        deadline: formData.deadline || null,
        mode: mode,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        revenue_generated: 0,
      });
      
      toast.success("Projet créé !");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        segment: "ecommerce",
        status: "planned",
        deadline: "",
        budget: "",
      });
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleEditClick = (project: NonNullable<typeof projects>[0]) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || "",
      segment: project.segment,
      status: project.status,
      deadline: project.deadline || "",
      budget: project.budget?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    try {
      await updateProject.mutateAsync({
        id: editingProject.id,
        name: editFormData.name,
        description: editFormData.description || null,
        segment: editFormData.segment,
        status: editFormData.status,
        deadline: editFormData.deadline || null,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : null,
      });
      
      toast.success("Projet mis à jour !");
      setIsEditDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleProgressUpdate = async (id: string, progress: number) => {
    try {
      await updateProject.mutateAsync({
        id,
        progress,
        status: progress === 100 ? "completed" : progress > 0 ? "in_progress" : "planned",
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Projets <span className="text-gradient">2026</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Gestion de tes projets business" : "Tes projets personnels"}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un projet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du projet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Boutique Shopify V2"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="segment">Segment</Label>
                    <Select
                      value={formData.segment}
                      onValueChange={(value: typeof formData.segment) => setFormData({ ...formData, segment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: typeof formData.status) => setFormData({ ...formData, status: value })}
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du projet"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={createProject.isPending}>
                  {createProject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Créer le projet"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Projets totaux</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-ecommerce/20">
                <CheckCircle2 className="h-5 w-5 text-segment-ecommerce" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Terminés</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.planned}</p>
                <p className="text-xs text-muted-foreground">Planifiés</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => {
              const StatusIcon = statusConfig[project.status].icon;
              
              return (
                <GlassCard 
                  key={project.id} 
                  className={cn(
                    "p-5 border-l-4 cursor-pointer transition-all hover:scale-[1.02]",
                    segmentColors[project.segment]
                  )}
                  onClick={() => handleEditClick(project)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("rounded-lg p-2", segmentBgColors[project.segment])}>
                      <FolderKanban className={cn("h-5 w-5", segmentColors[project.segment].split(" ")[1])} />
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs", statusConfig[project.status].color)}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusConfig[project.status].label}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-1">{project.name}</h3>
                  {project.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  {project.budget && (
                    <p className="text-xs text-muted-foreground">
                      Budget: {project.budget.toLocaleString('fr-FR')}€
                    </p>
                  )}
                  
                  {/* Progress bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={project.progress}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleProgressUpdate(project.id, parseInt(e.target.value));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </GlassCard>
              );
            })}
            
            {/* Add new project card */}
            <GlassCard 
              className="p-5 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setIsDialogOpen(true)}
            >
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Ajouter un projet</p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom du projet</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-segment">Segment</Label>
                  <Select
                    value={editFormData.segment}
                    onValueChange={(value: typeof editFormData.segment) => setEditFormData({ ...editFormData, segment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: typeof editFormData.status) => setEditFormData({ ...editFormData, status: value })}
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deadline">Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-budget">Budget (€)</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Description du projet"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={updateProject.isPending}>
                {updateProject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
