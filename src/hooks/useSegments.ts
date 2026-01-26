import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart,
  Video,
  Briefcase,
  Sparkles,
  Search,
  Smartphone,
  Palette,
  Heart,
  Plane,
  FolderKanban,
  Home,
  Star,
  Zap,
  Target,
  Trophy,
  Rocket,
  Crown,
  Gem,
  Flame,
  Globe,
  type LucideIcon,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface Segment {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  mode: "work" | "personal";
  order_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentInput {
  name: string;
  slug: string;
  icon: string;
  color: string;
  mode: "work" | "personal";
  order_index?: number;
}

// ============================================
// ICON MAP
// ============================================

export const ICON_MAP: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  "video": Video,
  "briefcase": Briefcase,
  "sparkles": Sparkles,
  "search": Search,
  "smartphone": Smartphone,
  "palette": Palette,
  "heart": Heart,
  "plane": Plane,
  "folder-kanban": FolderKanban,
  "home": Home,
  "star": Star,
  "zap": Zap,
  "target": Target,
  "trophy": Trophy,
  "rocket": Rocket,
  "crown": Crown,
  "gem": Gem,
  "flame": Flame,
  "globe": Globe,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// ============================================
// HOOKS
// ============================================

export function useSegments(mode?: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["segments", mode],
    queryFn: async () => {
      let query = supabase
        .from("segments")
        .select("*")
        .eq("user_id", user!.id);
      
      if (mode) {
        query = query.eq("mode", mode);
      }
      
      const { data, error } = await query.order("order_index");
      
      if (error) throw error;
      return data as Segment[];
    },
    enabled: !!user,
  });
}

export function useCreateSegment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SegmentInput) => {
      const { data, error } = await supabase
        .from("segments")
        .insert({
          user_id: user!.id,
          name: input.name,
          slug: input.slug,
          icon: input.icon,
          color: input.color,
          mode: input.mode,
          order_index: input.order_index ?? 50,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Segment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Segment> & { id: string }) => {
      const { data, error } = await supabase
        .from("segments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Segment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
    },
  });
}

export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("segments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
    },
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSegmentBySlug(segments: Segment[] | undefined, slug: string): Segment | undefined {
  return segments?.find(s => s.slug === slug);
}

export function getSegmentLabel(segments: Segment[] | undefined, slug: string): string {
  const segment = getSegmentBySlug(segments, slug);
  return segment?.name || slug;
}

export function getSegmentIcon(segments: Segment[] | undefined, slug: string): LucideIcon {
  const segment = getSegmentBySlug(segments, slug);
  const iconName = segment?.icon || "folder-kanban";
  return ICON_MAP[iconName] || FolderKanban;
}

export function getSegmentColor(segments: Segment[] | undefined, slug: string): string {
  const segment = getSegmentBySlug(segments, slug);
  return segment?.color || "#64748b";
}

export function getSegmentStyle(segments: Segment[] | undefined, slug: string) {
  const color = getSegmentColor(segments, slug);
  return {
    backgroundColor: color,
    color: "#fff",
  };
}

export function getSegmentBgStyle(segments: Segment[] | undefined, slug: string, opacity: number = 0.1) {
  const color = getSegmentColor(segments, slug);
  // Convert hex opacity to rgba
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
  };
}

export function getSegmentBorderStyle(segments: Segment[] | undefined, slug: string) {
  const color = getSegmentColor(segments, slug);
  return {
    borderColor: color,
  };
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Check if projects exist for a segment
export async function checkProjectsForSegment(slug: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("segment", slug);

  if (error) return 0;
  return count || 0;
}

// Reassign projects from one segment to another
export async function reassignProjectsToSegment(
  fromSlug: string,
  toSlug: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ segment: toSlug })
    .eq("user_id", userId)
    .eq("segment", fromSlug);

  if (error) throw error;
}
