import { useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Map, Plus, Loader2, FileText } from "lucide-react";
import { useMissionsWithProgress } from "@/hooks/useMissions";
import { MissionCard } from "./MissionCard";
import { AddMissionDialog } from "./AddMissionDialog";
import { BulkImportMissionDialog } from "./BulkImportMissionDialog";

interface ProjectRoadmapWidgetProps {
  projectId: string;
  mode: "work" | "personal";
}

export function ProjectRoadmapWidget({ projectId, mode }: ProjectRoadmapWidgetProps) {
  const { data: missions, isLoading } = useMissionsWithProgress(projectId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h3 className="font-trading text-lg">Roadmap</h3>
          <span className="text-xs text-muted-foreground">
            ({missions?.length || 0} missions)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsBulkDialogOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-2xl"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Import Rapide</span>
          </Button>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            size="sm"
            className="gap-1.5 rounded-2xl"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Content with internal scroll */}
      <ScrollArea className="flex-1 max-h-[500px]">
        <div className="pr-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : missions && missions.length > 0 ? (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-border" />
              
              {/* Missions */}
              <div className="space-y-4">
                {missions.map((mission, index) => (
                  <MissionCard 
                    key={mission.id} 
                    mission={mission}
                    isFirst={index === 0}
                    isLast={index === missions.length - 1}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Map className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Aucune mission définie</p>
              <p className="text-xs text-muted-foreground mb-4">
                Les missions structurent ta roadmap projet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="rounded-2xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer ta première mission
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <AddMissionDialog
        projectId={projectId}
        mode={mode}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <BulkImportMissionDialog
        projectId={projectId}
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
      />
    </GlassCard>
  );
}
