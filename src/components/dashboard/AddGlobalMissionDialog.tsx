import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarIcon, LayoutTemplate, PenLine, ShoppingCart, Code, FileSearch, LucideIcon } from "lucide-react";
import { useCreateMission, useCreateMissionsFromTemplate } from "@/hooks/useMissions";
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

interface MissionTemplate {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  missions: { title: string; description: string }[];
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "ecommerce-launch",
    name: "Lancement E-commerce",
    icon: ShoppingCart,
    description: "5 missions pour lancer une boutique",
    missions: [
      { title: "Étude de Marché", description: "Analyse concurrentielle et positionnement" },
      { title: "Setup Boutique", description: "Configuration technique et paiement" },
      { title: "Catalogue Produits", description: "Création fiches et photos" },
      { title: "Marketing & Acquisition", description: "SEO, Ads, Réseaux sociaux" },
      { title: "Lancement Officiel", description: "Go-live et communication" },
    ],
  },
  {
    id: "tech-app",
    name: "Projet Tech/App",
    icon: Code,
    description: "5 missions pour développer une app",
    missions: [
      { title: "Wireframes & Design", description: "UX/UI et maquettes" },
      { title: "MVP Core", description: "Fonctionnalités essentielles" },
      { title: "Backend & API", description: "Infrastructure et données" },
      { title: "Frontend & Intégration", description: "Interface utilisateur" },
      { title: "Beta Test & Launch", description: "Tests et déploiement" },
    ],
  },
  {
    id: "consulting-audit",
    name: "Consulting/Audit",
    icon: FileSearch,
    description: "4 missions pour un audit complet",
    missions: [
      { title: "Analyse Initiale", description: "Diagnostic et collecte données" },
      { title: "Interviews & Terrain", description: "Entretiens stakeholders" },
      { title: "Rédaction Rapport", description: "Synthèse et recommandations" },
      { title: "Présentation Client", description: "Livrable et suivi" },
    ],
  },
];

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
  const [viewMode, setViewMode] = useState<"manual" | "template">("manual");
  
  const { data: projects, isLoading: projectsLoading } = useProjects(mode);
  const createMission = useCreateMission();
  const createFromTemplate = useCreateMissionsFromTemplate();

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
        estimated_duration: null,
        is_focus: false,
        time_spent: 0,
      });

      toast.success("Mission créée !");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleTemplateSelect = async (template: MissionTemplate) => {
    if (!selectedProjectId) {
      toast.error("Sélectionne d'abord un projet de destination");
      return;
    }

    try {
      await createFromTemplate.mutateAsync({
        projectId: selectedProjectId,
        missions: template.missions,
      });

      toast.success(`${template.missions.length} missions créées depuis "${template.name}" !`);
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la création des missions");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedProjectId("");
    setDeadline(undefined);
    setViewMode("manual");
  };

  const ProjectSelector = () => (
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
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-trading">
              {viewMode === "manual" ? "Nouvelle Mission" : "Templates de Missions"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(v => v === "manual" ? "template" : "manual")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {viewMode === "manual" ? (
                <>
                  <LayoutTemplate className="h-4 w-4 mr-1" />
                  Templates
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4 mr-1" />
                  Manuel
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {viewMode === "template" ? (
          <div className="space-y-4">
            <ProjectSelector />

            <div className="space-y-3">
              <Label>Choisir un template</Label>
              {MISSION_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    disabled={!selectedProjectId || createFromTemplate.isPending}
                    className={cn(
                      "w-full p-4 rounded-2xl glass-card text-left transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      createFromTemplate.isPending && "animate-pulse"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground font-trading">
                          {template.missions.length} missions • {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.missions.map((m, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                        >
                          {m.title}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {createFromTemplate.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Création en cours...
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ProjectSelector />

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
        )}
      </DialogContent>
    </Dialog>
  );
}
