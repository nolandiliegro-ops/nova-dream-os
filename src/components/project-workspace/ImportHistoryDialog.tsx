import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, History } from "lucide-react";
import { useImportReports } from "@/hooks/useImportReports";
import { useDownloadDocument, formatFileSize } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ImportHistoryDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportHistoryDialog({ projectId, open, onOpenChange }: ImportHistoryDialogProps) {
  const { data: reports, isLoading } = useImportReports(projectId);
  const downloadMutation = useDownloadDocument();

  const handleDownload = (report: typeof reports extends (infer T)[] ? T : never) => {
    downloadMutation.mutate(report);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique des Imports
          </DialogTitle>
          <DialogDescription>
            Rapports générés lors des imports de roadmap
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3 pr-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                      {" · "}
                      {formatFileSize(report.file_size)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(report)}
                    disabled={downloadMutation.isPending}
                    className="shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Aucun rapport d'import</p>
              <p className="text-xs text-muted-foreground">
                Les rapports apparaîtront ici après chaque import de roadmap
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
