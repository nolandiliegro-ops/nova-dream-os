import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDeletedMissions } from "@/hooks/useSoftDeleteMission";
import { Trash2 } from "lucide-react";

interface DeletedMissionsDialogProps {
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletedMissionsDialog({ projectId, open, onOpenChange }: DeletedMissionsDialogProps) {
  const { data: deletedMissions, isLoading } = useDeletedMissions(projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
            Corbeille
          </DialogTitle>
          <DialogDescription>
            La fonctionnalité de corbeille sera disponible après le déploiement de la migration SQL.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Chargement...
            </div>
          )}

          {!isLoading && deletedMissions && deletedMissions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Aucune mission dans la corbeille</p>
              <p className="text-xs mt-2 text-muted-foreground/70">
                La fonctionnalité de suppression douce n'est pas encore activée.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
