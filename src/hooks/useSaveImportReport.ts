import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveImportReportParams {
  projectId: string;
  reportTitle: string;
  reportContent: string;
  userId: string;
}

export const useSaveImportReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, reportTitle, reportContent, userId }: SaveImportReportParams) => {
      // Créer un blob Markdown
      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_')}.md`;
      const filePath = `${userId}/${fileName}`;

      // Upload le fichier dans Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          contentType: 'text/markdown',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Erreur lors de l'upload : ${uploadError.message}`);
      }

      // Insérer les métadonnées dans la table documents
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          name: reportTitle,
          file_path: filePath,
          file_size: blob.size,
          mime_type: 'text/markdown',
          category: 'report',
          segment: projectId,
          mode: 'work',
          description: 'Rapport d\'import de roadmap généré automatiquement',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erreur lors de l'insertion : ${insertError.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("📄 Rapport enregistré dans les Documents");
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      toast.error(`Erreur : ${error.message}`);
    },
  });
};
