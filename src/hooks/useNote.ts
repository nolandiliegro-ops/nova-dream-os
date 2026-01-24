import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useRef } from "react";

export function useNote() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["note", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("content")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data?.content || "";
    },
    enabled: !!user,
  });
}

export function useUpdateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("notes")
        .upsert(
          { user_id: user!.id, content },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", user?.id] });
    },
  });

  const debouncedSave = useCallback(
    (content: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        mutation.mutate(content);
      }, 800);
    },
    [mutation]
  );

  return { ...mutation, debouncedSave };
}
