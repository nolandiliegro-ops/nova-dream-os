import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, FileText, Plus, Edit, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ImportHistoryDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportHistoryEntry {
  id: string;
  project_name: string;
  created_count: number;
  updated_count: number;
  identical_count: number;
  total_count: number;
  changes: Array<{
    type: 'create' | 'update' | 'identical';
    missionTitle: string;
    details?: {
      before?: any;
      after?: any;
    };
  }>;
  created_at: string;
}

export const ImportHistoryDialogNew = ({ projectId, open, onOpenChange }: ImportHistoryDialogProps) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['import-history', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_history' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ImportHistoryEntry[];
    },
    enabled: open,
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'update':
        return <Edit className="h-4 w-4 text-accent-foreground" />;
      case 'identical':
        return <Check className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'create':
        return 'Créée';
      case 'update':
        return 'Modifiée';
      case 'identical':
        return 'Identique';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Imports
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Rapports générés lors des imports de roadmap
          </p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Aucun rapport d'import</p>
              <p className="text-xs text-muted-foreground">
                Les rapports apparaîtront ici après chaque import de roadmap
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  {/* En-tête avec date et statistiques */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(entry.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.total_count} mission{entry.total_count > 1 ? 's' : ''} traitée{entry.total_count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      {entry.created_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3 text-primary" />
                          <span>{entry.created_count} créée{entry.created_count > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {entry.updated_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Edit className="h-3 w-3 text-accent-foreground" />
                          <span>{entry.updated_count} modifiée{entry.updated_count > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {entry.identical_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-muted-foreground" />
                          <span>{entry.identical_count} identique{entry.identical_count > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Liste des modifications */}
                  <div className="space-y-2">
                    {entry.changes
                      .filter(change => change.type !== 'identical')
                      .map((change, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {getActionIcon(change.type)}
                          <div className="flex-1">
                            <p className="font-medium">{change.missionTitle}</p>
                            {change.type === 'update' && change.details && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {change.details.before?.duration !== change.details.after?.duration && (
                                  <p>
                                    Durée : {change.details.before?.duration || '—'} → {change.details.after?.duration || '—'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getActionLabel(change.type)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
