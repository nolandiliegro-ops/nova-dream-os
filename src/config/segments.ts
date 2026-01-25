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
  type LucideIcon,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type WorkSegment = "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other";
export type PersonalSegment = "hobby" | "wellness" | "travel" | "other";
export type Segment = WorkSegment | PersonalSegment;

export interface SegmentOption {
  value: string;
  label: string;
}

// ============================================
// SEGMENT LISTS
// ============================================

export const WORK_SEGMENTS: SegmentOption[] = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "tiktok", label: "TikTok" },
  { value: "consulting", label: "Consulting" },
  { value: "oracle", label: "Oracle" },
  { value: "tech", label: "Dream App" },
  { value: "data", label: "Les Enquêtes" },
  { value: "other", label: "Autre" },
];

export const PERSONAL_SEGMENTS: SegmentOption[] = [
  { value: "hobby", label: "Hobbies" },
  { value: "wellness", label: "Bien-être" },
  { value: "travel", label: "Voyages" },
  { value: "other", label: "Autre" },
];

// ============================================
// LABELS
// ============================================

export const SEGMENT_LABELS: Record<string, string> = {
  // Work segments
  ecommerce: "E-Commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  // Personal segments
  hobby: "Hobbies",
  wellness: "Bien-être",
  travel: "Voyages",
  // Shared
  other: "Autre",
};

// ============================================
// ICONS
// ============================================

export const SEGMENT_ICONS: Record<string, LucideIcon> = {
  // Work segments
  ecommerce: ShoppingCart,
  tiktok: Video,
  consulting: Briefcase,
  oracle: Sparkles,
  data: Search,
  tech: Smartphone,
  // Personal segments
  hobby: Palette,
  wellness: Heart,
  travel: Plane,
  // Shared
  other: FolderKanban,
};

// ============================================
// COLORS (Badge / Icon background)
// ============================================

export const SEGMENT_COLORS: Record<string, string> = {
  // Work segments
  ecommerce: "bg-segment-ecommerce text-white",
  tiktok: "bg-segment-tiktok text-white",
  consulting: "bg-segment-consulting text-white",
  oracle: "bg-segment-oracle text-white",
  data: "bg-segment-data text-white",
  tech: "bg-segment-tech text-white",
  // Personal segments (Teal/Emerald palette)
  hobby: "bg-segment-oracle text-white",
  wellness: "bg-segment-data text-white",
  travel: "bg-segment-consulting text-white",
  // Shared
  other: "bg-muted text-foreground",
};

// ============================================
// BACKGROUND COLORS (Cards / Containers)
// ============================================

export const SEGMENT_BG_COLORS: Record<string, string> = {
  // Work segments
  ecommerce: "bg-segment-ecommerce/10",
  tiktok: "bg-segment-tiktok/10",
  consulting: "bg-segment-consulting/10",
  oracle: "bg-segment-oracle/10",
  data: "bg-segment-data/10",
  tech: "bg-segment-tech/10",
  // Personal segments
  hobby: "bg-segment-oracle/10",
  wellness: "bg-segment-data/10",
  travel: "bg-segment-consulting/10",
  // Shared
  other: "bg-muted/50",
};

// ============================================
// BORDER COLORS
// ============================================

export const SEGMENT_BORDER_COLORS: Record<string, string> = {
  // Work segments
  ecommerce: "border-segment-ecommerce",
  tiktok: "border-segment-tiktok",
  consulting: "border-segment-consulting",
  oracle: "border-segment-oracle",
  data: "border-segment-data",
  tech: "border-segment-tech",
  // Personal segments
  hobby: "border-segment-oracle",
  wellness: "border-segment-data",
  travel: "border-segment-consulting",
  // Shared
  other: "border-muted",
};

// ============================================
// HELPERS
// ============================================

export const getSegmentsForMode = (mode: "work" | "personal"): SegmentOption[] =>
  mode === "work" ? WORK_SEGMENTS : PERSONAL_SEGMENTS;

export const getDefaultSegmentForMode = (mode: "work" | "personal"): string =>
  mode === "work" ? "ecommerce" : "wellness";

export const getSegmentLabel = (segment: string): string =>
  SEGMENT_LABELS[segment] || segment;

export const getSegmentIcon = (segment: string): LucideIcon =>
  SEGMENT_ICONS[segment] || FolderKanban;

export const getSegmentColor = (segment: string): string =>
  SEGMENT_COLORS[segment] || SEGMENT_COLORS.other;

export const getSegmentBgColor = (segment: string): string =>
  SEGMENT_BG_COLORS[segment] || SEGMENT_BG_COLORS.other;

export const getSegmentBorderColor = (segment: string): string =>
  SEGMENT_BORDER_COLORS[segment] || SEGMENT_BORDER_COLORS.other;
