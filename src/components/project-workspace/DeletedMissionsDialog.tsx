import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeletedMissions, useRestoreMission, usePermanentDeleteMission } from "@/hooks/useSoftDeleteMission";
import { Trash2, RotateCcw, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
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
import { useState } from "react";

interface DeletedMissionsDialogProps {
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletedMissionsDialog({ projectId, open, onOpenChange }: DeletedMissionsDialogProps) {
  const { data: deletedMissions, isLoading } = useDeletedMissions(projectId);
  const restoreMission = useRestoreMission();
  const permanentDelete = usePermanentDeleteMission();
  const [missionToDelete, setMissionToDelete] = useState<string | null>(null);

  const handleRestore = (missionId: string) => {
    restoreMission.mutate(missionId);
  };

  const handlePermanentDelete = () => {
    if (missionToDelete) {
      permanentDelete.mutate(missionToDelete, {
        onSuccess: () => {
          setMissionToDelete(null);
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              Corbeille
            </DialogTitle>
            <DialogDescription>
              Les missions supprimées sont conservées pendant 30 jours. Vous pouvez les restaurer ou les supprimer définitivement.
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
              </div>
            )}

            {deletedMissions?.map((mission) => {
              const deletedAt = new Date(mission.deleted_at!);
              const daysRemaining = 30 - Math.floor((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={mission.id}
                  className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{mission.title}</h3>
                      {mission.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {mission.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Supprimée{" "}
                          {formatDistanceToNow(deletedAt, {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        {daysRemaining > 0 && (
                          <span className="text-orange-500 font-medium">
                            {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                          </span>
                        )}
                        {daysRemaining <= 0 && (
                          <span className="text-red-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Sera supprimée définitivement bientôt
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(mission.id)}
                        disabled={restoreMission.isPending}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMissionToDelete(mission.id)}
                        disabled={permanentDelete.isPending}
                        className="gap-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!missionToDelete} onOpenChange={() => setMissionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Supprimer définitivement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La mission et toutes ses tâches seront supprimées définitivement.
              Vous ne pourrez plus les récupérer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
