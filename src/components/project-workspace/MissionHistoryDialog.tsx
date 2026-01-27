import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMissionHistory, useRestoreMissionVersion, useEditMissionFromHistory, type MissionHistoryEntry } from "@/hooks/useMissionHistory";
import { History, RotateCcw, Edit, ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface MissionHistoryDialogProps {
  missionId: string;
  missionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionLabels: Record<MissionHistoryEntry["action"], { label: string; color: string; icon: string }> = {
  created: { label: "Créée", color: "text-green-500", icon: "✨" },
  updated: { label: "Modifiée", color: "text-blue-500", icon: "✏️" },
  deleted: { label: "Supprimée", color: "text-red-500", icon: "🗑️" },
  restored: { label: "Restaurée", color: "text-purple-500", icon: "♻️" },
};

export function MissionHistoryDialog({ missionId, missionTitle, open, onOpenChange }: MissionHistoryDialogProps) {
  const { data: history, isLoading } = useMissionHistory(missionId);
  const restoreVersion = useRestoreMissionVersion();
  const editMission = useEditMissionFromHistory();
  
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleRestore = (entry: MissionHistoryEntry) => {
    if (confirm("Voulez-vous restaurer cette version de la mission ?")) {
      restoreVersion.mutate({ missionId, historyEntry: entry });
    }
  };

  const handleEdit = (entry: MissionHistoryEntry) => {
    setEditingEntry(entry.id);
    setEditTitle(entry.previous_title || "");
    setEditDescription(entry.previous_description || "");
  };

  const handleSaveEdit = () => {
    editMission.mutate(
      {
        missionId,
        title: editTitle,
        description: editDescription,
      },
      {
        onSuccess: () => {
          setEditingEntry(null);
          onOpenChange(false);
        },
      }
    );
  };

  const renderFieldChange = (field: string, oldValue: any, newValue: any) => {
    const fieldLabels: Record<string, string> = {
      title: "Titre",
      description: "Description",
      status: "Statut",
      order_index: "Ordre",
    };

    return (
      <div key={field} className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{fieldLabels[field] || field}</p>
        <div className="flex items-center gap-2 text-sm">
          {oldValue !== undefined && oldValue !== null && (
            <>
              <span className="text-red-500 line-through">{String(oldValue).substring(0, 50)}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </>
          )}
          <span className="text-green-500">{String(newValue).substring(0, 50)}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique : {missionTitle}
          </DialogTitle>
          <DialogDescription>
            Consultez toutes les modifications apportées à cette mission. Vous pouvez restaurer ou éditer une version précédente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Chargement de l'historique...
            </div>
          )}

          {!isLoading && history && history.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucun historique disponible
            </div>
          )}

          {history?.map((entry) => {
            const actionInfo = actionLabels[entry.action];
            const isEditing = editingEntry === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3"
              >
                {/* En-tête */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{actionInfo.icon}</span>
                    <span className={`font-medium ${actionInfo.color}`}>
                      {actionInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {entry.action === "updated" && !isEditing && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(entry)}
                        disabled={restoreVersion.isPending}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Éditer
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                {!isEditing && (
                  <div className="space-y-2 pl-7">
                    {entry.changed_fields.map((field) => {
                      const oldValue = (entry as any)[`previous_${field}`];
                      const newValue = (entry as any)[`new_${field}`];
                      return renderFieldChange(field, oldValue, newValue);
                    })}
                  </div>
                )}

                {/* Mode édition */}
                {isEditing && (
                  <div className="space-y-3 pl-7">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Titre de la mission"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Description</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description de la mission"
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(null)}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={editMission.isPending}
                      >
                        {editMission.isPending ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
