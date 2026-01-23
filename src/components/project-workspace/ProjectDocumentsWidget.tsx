import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  Loader2,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments, formatFileSize } from "@/hooks/useDocuments";

interface ProjectDocumentsWidgetProps {
  segment: string;
  mode: "work" | "personal";
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf")) return FileText;
  return File;
};

export function ProjectDocumentsWidget({ segment, mode }: ProjectDocumentsWidgetProps) {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useDocuments(mode, segment);

  // Get recent documents (last 5)
  const recentDocs = documents?.slice(0, 5) || [];

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Documents</h3>
          {documents && documents.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({documents.length})
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/documents?segment=${segment}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : recentDocs.length > 0 ? (
        <div className="flex-1 space-y-2">
          {recentDocs.map((doc) => {
            const FileIcon = getFileIcon(doc.mime_type);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/documents?segment=${segment}`)}
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            );
          })}

          {documents && documents.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate(`/documents?segment=${segment}`)}
            >
              Voir les {documents.length - 5} autres documents
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
          <FileText className="h-8 w-8 mb-2 opacity-50" />
          <p>Aucun document pour ce segment</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate(`/documents?segment=${segment}`)}
            className="mt-2 gap-1"
          >
            <Upload className="h-3 w-3" />
            Ajouter un document
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
