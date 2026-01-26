import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  user_id: string;
  project_id?: string;
  role: 'user' | 'assistant';
  content: string;
  attachments: any[];
  created_at: string;
}

export interface CreateMessageInput {
  role: 'user' | 'assistant';
  content: string;
  attachments?: any[];
  project_id?: string;
}

/**
 * Hook pour gérer l'historique des conversations avec Nova
 * Supporte la persistance multi-device et la synchronisation en temps réel
 * 
 * @param projectId - ID du projet (optionnel, pour filtrer les messages par projet)
 * @param limit - Nombre maximum de messages à récupérer (défaut: 100)
 * @returns {Object} - Messages, fonctions CRUD et état de chargement
 */
export const useChatHistory = (projectId?: string, limit = 100) => {
  const queryClient = useQueryClient();

  // Récupérer l'historique des messages
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['chat-history', projectId],
    queryFn: async () => {
      const query = supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (projectId) {
        query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching chat history:', error);
        throw error;
      }

      return (data || []) as ChatMessage[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Ajouter un message
  const addMessage = useMutation({
    mutationFn: async (message: CreateMessageInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          project_id: message.project_id || projectId,
          role: message.role,
          content: message.content,
          attachments: message.attachments || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        throw error;
      }

      return data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', projectId] });
    },
    onError: (error) => {
      console.error('Failed to add message:', error);
      toast.error('Impossible d\'ajouter le message');
    },
  });

  // Supprimer un message
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', projectId] });
      toast.success('Message supprimé');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      toast.error('Impossible de supprimer le message');
    },
  });

  // Supprimer tout l'historique
  const clearHistory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const query = supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (projectId) {
        query.eq('project_id', projectId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error clearing history:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', projectId] });
      toast.success('Historique effacé');
    },
    onError: (error) => {
      console.error('Failed to clear history:', error);
      toast.error('Impossible d\'effacer l\'historique');
    },
  });

  // Subscription Realtime pour la synchronisation multi-device
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser();

    user.then((userData) => {
      if (!userData.user) return;

      const channel = supabase
        .channel('chat_history_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_history',
            filter: projectId 
              ? `project_id=eq.${projectId}` 
              : `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            console.log('Realtime change detected:', payload);
            // Invalider le cache pour forcer un refresh
            queryClient.invalidateQueries({ queryKey: ['chat-history', projectId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [projectId, queryClient]);

  return {
    messages: messages || [],
    isLoading,
    error,
    addMessage: addMessage.mutateAsync,
    deleteMessage: deleteMessage.mutateAsync,
    clearHistory: clearHistory.mutateAsync,
    isAddingMessage: addMessage.isPending,
    isDeletingMessage: deleteMessage.isPending,
    isClearingHistory: clearHistory.isPending,
  };
};
