import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

// API Status types
export interface ApiStatus {
  resend: boolean;
  lovable_api: boolean;
}

// Hook to check API configuration status
export function useApiStatus() {
  return useQuery({
    queryKey: ["api-status"],
    queryFn: async (): Promise<ApiStatus> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-api-status`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch API status");
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}

export interface ApiConfig {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: Json;
  is_active: boolean;
  mode: "work" | "personal";
  created_at: string;
  updated_at: string;
}

export function useApiConfig(type: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["api_configs", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_configs")
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as ApiConfig | null;
    },
    enabled: !!user,
  });
}

export function useApiConfigs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["api_configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_configs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApiConfig[];
    },
    enabled: !!user,
  });
}

export function useUpsertApiConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      type,
      name,
      config,
      mode = "work",
    }: {
      type: string;
      name: string;
      config: { url?: string; [key: string]: unknown };
      mode?: "work" | "personal";
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Cast config to Json for Supabase
      const jsonConfig = config as Json;

      // Check if config exists
      const { data: existing } = await supabase
        .from("api_configs")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", type)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("api_configs")
          .update({ name, config: jsonConfig, mode })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("api_configs")
          .insert([{
            user_id: user.id,
            type,
            name,
            config: jsonConfig,
            mode,
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_configs"] });
    },
  });
}

export function useDeleteApiConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_configs"] });
    },
  });
}
