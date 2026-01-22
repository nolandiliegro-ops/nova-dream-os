import { useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  FolderOpen,
  File,
  Image,
  FileSpreadsheet,
  Download,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDocuments,
  useDocumentStats,
  useUploadDocument,
  useDeleteDocument,
  useDownloadDocument,
  formatFileSize,
  type Document,
} from "@/hooks/useDocuments";

const segments = [
  { id: "ecommerce", label: "E-commerce", color: "segment-ecommerce" },
  { id: "tiktok", label: "TikTok", color: "segment-tiktok" },
  { id: "consulting", label: "Consulting", color: "segment-consulting" },
  { id: "oracle", label: "Oracle", color: "segment-oracle" },
  { id: "Autre", label: "Autre", color: "muted-foreground" },
];

const segmentColors: Record<string, string> = {
  ecommerce: "border-l-segment-ecommerce",
  tiktok: "border-l-segment-tiktok",
  consulting: "border-l-segment-consulting",
  oracle: "border-l-segment-oracle",
  Autre: "border-l-muted-foreground",
};

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  if (mimeType.includes("word")) return FileText;
  return File;
};

export default function Documents() {
  const { mode } = useMode();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>("Autre");

  // Queries & mutations
  const { data: documents = [], isLoading } = useDocuments(mode, activeSegment);
  const { data: stats } = useDocumentStats(mode);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const isUploading = uploadMutation.isPending;

  // Handle file upload
  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      setUploadingFileName(file.name);
      setUploadProgress(0);
      setUploadDialogOpen(false);

      try {
        await uploadMutation.mutateAsync({
          file,
          segment: selectedSegment,
          mode: mode as "work" | "personal",
          onProgress: setUploadProgress,
        });
      } finally {
        setUploadingFileName(null);
        setUploadProgress(0);
      }
    },
    [uploadMutation, selectedSegment, mode]
  );

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Open dialog to select segment before upload
        setUploadDialogOpen(true);
        // Store files temporarily
        if (fileInputRef.current) {
          const dt = new DataTransfer();
          for (let i = 0; i < files.length; i++) {
            dt.items.add(files[i]);
          }
          fileInputRef.current.files = dt.files;
        }
      }
    },
    []
  );

  const handleConfirmUpload = () => {
    if (fileInputRef.current?.files) {
      handleUpload(fileInputRef.current.files);
    }
  };

  const handleDelete = (doc: Document) => {
    setDeleteDoc(doc);
  };

  const confirmDelete = () => {
    if (deleteDoc) {
      deleteMutation.mutate(deleteDoc);
      setDeleteDoc(null);
    }
  };

  const handleDownload = (doc: Document) => {
    downloadMutation.mutate(doc);
  };

  const toggleSegmentFilter = (segmentId: string) => {
    setActiveSegment((prev) => (prev === segmentId ? null : segmentId));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Documents <span className="text-gradient">& Coffre-fort</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work"
                ? "Tes documents business sécurisés"
                : "Tes documents personnels"}
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => setUploadDialogOpen(true)}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            Uploader
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(stats?.bySegment || {}).length}
                </p>
                <p className="text-xs text-muted-foreground">Catégories</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-ecommerce/20">
                <FileSpreadsheet className="h-5 w-5 text-segment-ecommerce" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatFileSize(stats?.totalSize || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Espace utilisé</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">50 MB</p>
                <p className="text-xs text-muted-foreground">Limite par fichier</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Folders - Clickable for filtering */}
        <div className="grid gap-4 md:grid-cols-5">
          {segments.map((seg) => {
            const count = stats?.bySegment[seg.id] || 0;
            const isActive = activeSegment === seg.id;

            return (
              <GlassCard
                key={seg.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:scale-[1.02]",
                  `border-l-4 border-l-${seg.color}`,
                  isActive && "ring-2 ring-primary bg-primary/10"
                )}
                onClick={() => toggleSegmentFilter(seg.id)}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className={`h-8 w-8 text-${seg.color}`} />
                  <div>
                    <p className="font-medium">{seg.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} fichier{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <X className="h-3 w-3" />
                    Cliquer pour voir tout
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>

        {/* Upload Zone - Drag & Drop */}
        <GlassCard
          className={cn(
            "p-8 border-2 border-dashed transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-muted-foreground/30",
            isUploading && "pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="font-medium">{uploadingFileName}</p>
                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress}% uploadé
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload
                  className={cn(
                    "h-12 w-12 mx-auto mb-4 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <h3 className="font-semibold mb-2">
                  {isDragging
                    ? "Dépose ton fichier ici !"
                    : "Dépose tes fichiers ici"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique sur le bouton "Uploader" · PDF, Images, Excel supportés
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setUploadDialogOpen(true);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Parcourir les fichiers
                </Button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Documents List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {activeSegment
                ? `Documents ${segments.find((s) => s.id === activeSegment)?.label}`
                : "Tous les documents"}
            </h3>
            {activeSegment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSegment(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Voir tout
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document trouvé</p>
              <p className="text-sm">
                {activeSegment
                  ? "Aucun fichier dans cette catégorie"
                  : "Uploade ton premier document !"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const Icon = getDocumentIcon(doc.mime_type);
                const segmentColor =
                  segmentColors[doc.segment || "Autre"] || segmentColors.Autre;

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                      segmentColor
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} ·{" "}
                        {doc.segment || "Autre"}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Upload Dialog - Select segment before upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!fileInputRef.current?.files?.length && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fichier</label>
                <input
                  type="file"
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    if (fileInputRef.current && e.target.files) {
                      const dt = new DataTransfer();
                      for (let i = 0; i < e.target.files.length; i++) {
                        dt.items.add(e.target.files[i]);
                      }
                      fileInputRef.current.files = dt.files;
                    }
                  }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleConfirmUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Uploader
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier "{deleteDoc?.name}" sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
