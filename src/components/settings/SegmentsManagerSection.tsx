import { useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Pencil, Trash2, FolderKanban, Lock } from "lucide-react";
import { toast } from "sonner";
import { useMode } from "@/contexts/ModeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  Segment,
  ICON_MAP,
  checkProjectsForSegment,
  reassignProjectsToSegment,
} from "@/hooks/useSegments";
import { SegmentEditDialog } from "./SegmentEditDialog";

export function SegmentsManagerSection() {
  const { mode } = useMode();
  const { user } = useAuth();
  const { data: segments, isLoading } = useSegments(mode);
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [linkedProjectsCount, setLinkedProjectsCount] = useState(0);
  const [isCheckingProjects, setIsCheckingProjects] = useState(false);

  const handleCreateNew = () => {
    setEditingSegment(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setEditDialogOpen(true);
  };

  const handleSave = async (data: { name: string; slug: string; icon: string; color: string }) => {
    try {
      if (editingSegment) {
        await updateSegment.mutateAsync({
          id: editingSegment.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          // Don't update slug for existing segments to avoid breaking references
        });
        toast.success("Catégorie mise à jour ! 🎨");
      } else {
        await createSegment.mutateAsync({
          name: data.name,
          slug: data.slug,
          icon: data.icon,
          color: data.color,
          mode,
        });
        toast.success("Nouvelle catégorie créée ! 🚀");
      }
      setEditDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDeleteClick = async (segment: Segment) => {
    if (!user) return;
    
    setSegmentToDelete(segment);
    setIsCheckingProjects(true);
    
    try {
      const count = await checkProjectsForSegment(segment.slug, user.id);
      setLinkedProjectsCount(count);
      setDeleteDialogOpen(true);
    } catch (error) {
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsCheckingProjects(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!segmentToDelete || !user) return;

    try {
      // If there are linked projects, reassign them to "other"
      if (linkedProjectsCount > 0) {
        await reassignProjectsToSegment(segmentToDelete.slug, "other", user.id);
      }
      
      await deleteSegment.mutateAsync(segmentToDelete.id);
      toast.success("Catégorie supprimée !");
      setDeleteDialogOpen(false);
      setSegmentToDelete(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const isSaving = createSegment.isPending || updateSegment.isPending;

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              mode === "work" ? "bg-segment-ecommerce/20" : "bg-segment-data/20"
            }`}>
              <FolderKanban className={`h-5 w-5 ${
                mode === "work" ? "text-segment-ecommerce" : "text-segment-data"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">
                {mode === "work" ? "Mes Catégories Business" : "Mes Catégories Perso"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Crée et personnalise tes segments
              </p>
            </div>
          </div>
          <Badge variant={mode === "work" ? "default" : "secondary"} className="font-trading">
            {mode === "work" ? "WORK" : "PERSO"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {segments?.map((segment) => {
              const IconComponent = ICON_MAP[segment.icon] || FolderKanban;
              
              return (
                <div
                  key={segment.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: segment.color }}
                    >
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="font-medium">{segment.name}</span>
                      {segment.is_default && (
                        <span className="ml-2 text-xs text-muted-foreground">(par défaut)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(segment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {segment.is_default ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-30 cursor-not-allowed"
                        disabled
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(segment)}
                        disabled={isCheckingProjects}
                      >
                        {isCheckingProjects ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              className="w-full mt-4 gap-2 border-dashed"
              onClick={handleCreateNew}
            >
              <Plus className="h-4 w-4" />
              Ajouter une catégorie
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Edit/Create Dialog */}
      <SegmentEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        segment={editingSegment}
        mode={mode}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              {linkedProjectsCount > 0 ? (
                <>
                  <span className="text-amber-500 font-medium">
                    ⚠️ {linkedProjectsCount} projet(s) utilisent cette catégorie.
                  </span>
                  <br />
                  Ils seront automatiquement réattribués à la catégorie "Autre".
                </>
              ) : (
                "Cette action est irréversible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSegment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
