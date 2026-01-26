import { motion } from "framer-motion";
import { X, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Attachment {
  id: string;
  name: string;
  type: "file" | "document";
  mimeType?: string;
  previewUrl?: string;
  file?: File;
  documentId?: string;
  filePath?: string;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  onView?: (attachment: Attachment) => void;
  className?: string;
}

export const AttachmentPreview = ({
  attachments,
  onRemove,
  onView,
  className,
}: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  const getIcon = (attachment: Attachment) => {
    const mimeType = attachment.mimeType || "";
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-primary" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const isImage = (attachment: Attachment) => {
    return attachment.mimeType?.startsWith("image/");
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) => (
        <motion.div
          key={attachment.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={cn(
            "relative group rounded-lg overflow-hidden",
            "border border-border bg-muted/30",
            "flex items-center gap-2",
            isImage(attachment) ? "p-1" : "px-3 py-2"
          )}
        >
          {/* Preview ou icône */}
          {isImage(attachment) && attachment.previewUrl ? (
            <button
              type="button"
              onClick={() => onView?.(attachment)}
              className="block w-20 h-20 rounded overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img
                src={attachment.previewUrl}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onView?.(attachment)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {getIcon(attachment)}
              <span className="text-sm truncate max-w-[120px]">
                {attachment.name}
              </span>
            </button>
          )}

          {/* Bouton supprimer */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(attachment.id)}
            className={cn(
              "h-6 w-6 rounded-full",
              "bg-background/80 hover:bg-destructive hover:text-destructive-foreground",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isImage(attachment) 
                ? "absolute top-1 right-1" 
                : "shrink-0"
            )}
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
};
