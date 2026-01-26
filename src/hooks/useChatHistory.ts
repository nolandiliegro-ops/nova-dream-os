import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
 */
export const useChatHistory = (projectId?: string, limit = 100) => {
  const queryClient = useQueryClient();

  // Récupérer l'historique des messages
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['chat-history', projectId],
    queryFn: async () => {
      let query = supabase
        .from('chat_history' as any)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching chat history:', error);
        throw error;
      }

      return (data as unknown as ChatMessage[]) || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Ajouter un message
  const addMessage = useMutation({
    mutationFn: async (message: CreateMessageInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_history' as any)
        .insert({
          user_id: userData.user.id,
          project_id: message.project_id || projectId || null,
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

      return data as unknown as ChatMessage;
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
        .from('chat_history' as any)
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
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('chat_history' as any)
        .delete()
        .eq('user_id', userData.user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
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
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      channel = supabase
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
            queryClient.invalidateQueries({ queryKey: ['chat-history', projectId] });
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
