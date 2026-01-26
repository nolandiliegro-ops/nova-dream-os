import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Segment, ICON_MAP, AVAILABLE_ICONS, generateSlug } from "@/hooks/useSegments";

interface SegmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: Segment | null;
  mode: "work" | "personal";
  onSave: (data: { name: string; slug: string; icon: string; color: string }) => void;
  isSaving: boolean;
}

const PRESET_COLORS = [
  "#22c55e", // Green
  "#a855f7", // Purple
  "#3b82f6", // Blue
  "#f97316", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
  "#64748b", // Slate
  "#000000", // Black
];

export function SegmentEditDialog({
  open,
  onOpenChange,
  segment,
  mode,
  onSave,
  isSaving,
}: SegmentEditDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("folder-kanban");
  const [color, setColor] = useState("#6366f1");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setSlug(segment.slug);
      setIcon(segment.icon);
      setColor(segment.color);
      setSlugEdited(true);
    } else {
      setName("");
      setSlug("");
      setIcon("folder-kanban");
      setColor("#6366f1");
      setSlugEdited(false);
    }
  }, [segment, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited && !segment) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    onSave({ name: name.trim(), slug: slug.trim(), icon, color });
  };

  const isEditing = !!segment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 rounded-xl bg-muted/30 border border-border/50">
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg"
              style={{ backgroundColor: color }}
            >
              {(() => {
                const IconComponent = ICON_MAP[icon];
                return IconComponent ? <IconComponent className="h-5 w-5 text-white" /> : null;
              })()}
              <span className="font-medium text-white">{name || "Aperçu"}</span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="segment-name">Nom de la catégorie</Label>
            <Input
              id="segment-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Dropshipping, Coaching, etc."
              autoFocus
            />
          </div>

          {/* Slug (hidden for editing default segments) */}
          {!segment?.is_default && (
            <div className="space-y-2">
              <Label htmlFor="segment-slug">Identifiant technique</Label>
              <Input
                id="segment-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(generateSlug(e.target.value));
                  setSlugEdited(true);
                }}
                placeholder="auto-genere"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Utilisé en interne. Ne pas modifier sauf nécessaire.
              </p>
            </div>
          )}

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? "border-white ring-2 ring-primary scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="font-mono text-sm flex-1"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 max-h-40 overflow-y-auto">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = ICON_MAP[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg border transition-all ${
                      icon === iconName
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-5 w-5 mx-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
