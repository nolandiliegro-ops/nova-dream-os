import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload, FolderOpen, FileText, Image, Loader2 } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useMode } from "@/contexts/ModeContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AttachmentPickerProps {
  onFileSelect: (files: File[]) => void;
  onDocumentSelect: (document: { id: string; name: string; file_path: string }) => void;
  disabled?: boolean;
}

export const AttachmentPicker = ({
  onFileSelect,
  onDocumentSelect,
  disabled = false,
}: AttachmentPickerProps) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mode } = useMode();
  const { data: documents, isLoading } = useDocuments(mode);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="gap-3 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Télécharger depuis l'appareil</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowLibrary(true)}
            className="gap-3 cursor-pointer"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Choisir dans la bibliothèque</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal bibliothèque */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Bibliothèque de documents
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents && documents.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onDocumentSelect({
                        id: doc.id,
                        name: doc.name,
                        file_path: doc.file_path,
                      });
                      setShowLibrary(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg text-left",
                      "bg-muted/30 hover:bg-muted/50 transition-colors",
                      "border border-transparent hover:border-primary/20"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {getFileIcon(doc.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(doc.created_at), "d MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Aucun document dans ta bibliothèque
              </p>
              <p className="text-sm text-muted-foreground/70">
                Télécharge des fichiers depuis ton appareil
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
