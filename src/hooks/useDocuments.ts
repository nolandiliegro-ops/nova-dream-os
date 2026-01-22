import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Document = Tables<"documents">;

interface UploadOptions {
  file: File;
  segment: string;
  mode: "work" | "personal";
  category?: string;
  description?: string;
  onProgress?: (progress: number) => void;
  autoAnalyze?: boolean; // NEW: trigger auto-analysis after upload
}

interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  bySegment: Record<string, number>;
}

// Fetch documents filtered by mode and optional segment
export const useDocuments = (mode: string, segment?: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["documents", user?.id, mode, segment],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("mode", mode)
        .order("created_at", { ascending: false });

      if (segment) {
        query = query.eq("segment", segment);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }

      return data as Document[];
    },
    enabled: !!user?.id,
  });
};

// Document statistics
export const useDocumentStats = (mode: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["document-stats", user?.id, mode],
    queryFn: async (): Promise<DocumentStats> => {
      if (!user?.id) {
        return { totalDocuments: 0, totalSize: 0, bySegment: {} };
      }

      const { data, error } = await supabase
        .from("documents")
        .select("file_size, segment")
        .eq("user_id", user.id)
        .eq("mode", mode);

      if (error) {
        console.error("Error fetching document stats:", error);
        throw error;
      }

      const stats: DocumentStats = {
        totalDocuments: data.length,
        totalSize: data.reduce((acc, doc) => acc + doc.file_size, 0),
        bySegment: {},
      };

      data.forEach((doc) => {
        const seg = doc.segment || "Autre";
        stats.bySegment[seg] = (stats.bySegment[seg] || 0) + 1;
      });

      return stats;
    },
    enabled: !!user?.id,
  });
};

// Trigger background analysis for a document
const triggerBackgroundAnalysis = async (documentId: string, userId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ documentId, userId }),
      }
    );

    if (response.ok) {
      console.log("Background analysis completed for document:", documentId);
    } else {
      console.warn("Background analysis failed:", await response.text());
    }
  } catch (error) {
    console.warn("Background analysis error:", error);
  }
};

// Upload document with progress tracking
export const useUploadDocument = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      segment,
      mode,
      category = "other",
      description,
      onProgress,
      autoAnalyze = true, // Default to auto-analyze
    }: UploadOptions): Promise<Document> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Generate unique file path: userId/timestamp_filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

      // Simulate progress for better UX (Supabase doesn't support real progress)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 10, 90);
        onProgress?.(progress);
      }, 100);

      try {
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        clearInterval(progressInterval);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        onProgress?.(95);

        // Insert metadata into documents table
        const { data: docData, error: dbError } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            segment,
            mode,
            category,
            description,
          })
          .select()
          .single();

        if (dbError) {
          // Rollback: delete the uploaded file if DB insert fails
          await supabase.storage.from("documents").remove([filePath]);
          throw dbError;
        }

        onProgress?.(100);

        // Trigger background analysis if enabled (non-blocking)
        if (autoAnalyze && (file.type.startsWith("image/") || file.type === "application/pdf")) {
          // Fire and forget - don't wait for completion
          triggerBackgroundAnalysis(docData.id, user.id);
        }

        return docData as Document;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
      queryClient.invalidateQueries({ queryKey: ["latest-document"] });
      toast.success("Document uploadé avec succès !");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload du document");
    },
  });
};

// Delete document (storage + database)
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Document) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete from DB even if storage delete fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;

      return document.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
      toast.success("Document supprimé");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Download document via signed URL
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (document: Document) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.file_path, 60); // 60 seconds expiry

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Failed to generate download URL");

      // Open in new tab for download
      window.open(data.signedUrl, "_blank");
      return data.signedUrl;
    },
    onError: (error) => {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    },
  });
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
