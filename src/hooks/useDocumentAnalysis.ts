import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DocumentAnalysis {
  summary: string;
  extractedData: {
    amounts: { value: number; currency: string; description: string }[];
    dates: { date: string; context: string }[];
    entities: string[];
  };
  documentType: string;
  suggestedAction?: string;
}

export interface AnalysisResult {
  success: boolean;
  analysis: DocumentAnalysis;
  documentName: string;
  documentSegment: string;
}

// Analyze a document by ID
export const useAnalyzeDocument = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (documentId: string): Promise<AnalysisResult> => {
      if (!user?.id) throw new Error("User not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            documentId,
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.error || "Rate limit atteint. Réessaie dans un moment.");
        }
        if (response.status === 402) {
          throw new Error(errorData.error || "Crédits IA épuisés.");
        }
        throw new Error(errorData.error || "Erreur lors de l'analyse");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Show success toast with document insights
      toast.success(`🧠 Nouvel insight détecté !`, {
        description: `Document "${data.documentName}" analysé avec succès`,
        duration: 6000,
        action: {
          label: "Voir",
          onClick: () => {
            // Navigate to documents page - could be enhanced
            window.location.href = "/documents";
          },
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'analyse");
    },
  });
};

// Get the most recent document for quick analysis
export const useLatestDocument = (mode: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["latest-document", user?.id, mode],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("mode", mode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
