import { useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Heart, 
  Plus, 
  Trash2, 
  Pencil, 
  Loader2,
  Dumbbell,
  Brain,
  BookOpen,
  Check,
  Flame,
  Coffee,
  Moon,
  Sun,
  Zap,
  Music,
  Smile,
  Target,
  Shield,
} from "lucide-react";
import { useHabits, useCreateHabit, useDeleteHabit, Habit } from "@/hooks/useHabits";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Available icons for habits
const HABIT_ICONS = [
  { id: "dumbbell", label: "Sport", icon: Dumbbell },
  { id: "brain", label: "Mental", icon: Brain },
  { id: "book-open", label: "Lecture", icon: BookOpen },
  { id: "flame", label: "Énergie", icon: Flame },
  { id: "coffee", label: "Routine", icon: Coffee },
  { id: "moon", label: "Sommeil", icon: Moon },
  { id: "sun", label: "Matin", icon: Sun },
  { id: "zap", label: "Productivité", icon: Zap },
  { id: "music", label: "Créativité", icon: Music },
  { id: "smile", label: "Bien-être", icon: Smile },
  { id: "target", label: "Objectif", icon: Target },
  { id: "shield", label: "Sobriété", icon: Shield },
  { id: "check", label: "Général", icon: Check },
];

const HABIT_COLORS = [
  { id: "segment-data", label: "Cyan", class: "bg-segment-data" },
  { id: "segment-oracle", label: "Orange", class: "bg-segment-oracle" },
  { id: "segment-consulting", label: "Bleu", class: "bg-segment-consulting" },
  { id: "segment-tiktok", label: "Violet", class: "bg-segment-tiktok" },
  { id: "segment-ecommerce", label: "Vert", class: "bg-segment-ecommerce" },
  { id: "segment-tech", label: "Rose", class: "bg-segment-tech" },
];

const FREQUENCIES = [
  { id: "daily", label: "Quotidien" },
  { id: "weekdays", label: "Jours ouvrés" },
  { id: "weekly", label: "Hebdomadaire" },
];

function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      const { error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habitude mise à jour !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

interface HabitFormData {
  title: string;
  icon: string;
  color: string;
  frequency: string;
}

function HabitFormDialog({
  open,
  onOpenChange,
  habit,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSubmit: (data: HabitFormData) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<HabitFormData>({
    title: habit?.title || "",
    icon: habit?.icon || "check",
    color: habit?.color || "segment-data",
    frequency: habit?.frequency || "daily",
  });

  // Reset form when dialog opens with new habit
  useState(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        icon: habit.icon || "check",
        color: habit.color || "segment-data",
        frequency: habit.frequency || "daily",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    onSubmit(formData);
  };

  const SelectedIcon = HABIT_ICONS.find(i => i.id === formData.icon)?.icon || Check;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habit ? "Modifier l'habitude" : "Nouvelle habitude"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="habit-title">Nom de l'habitude</Label>
            <Input
              id="habit-title"
              placeholder="Ex: Méditation, Sport..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_ICONS.map((iconOpt) => {
                const IconComp = iconOpt.icon;
                return (
                  <button
                    key={iconOpt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconOpt.id })}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all",
                      formData.icon === iconOpt.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
                    )}
                    title={iconOpt.label}
                  >
                    <IconComp className="h-5 w-5 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((colorOpt) => (
                <button
                  key={colorOpt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorOpt.id })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform",
                    colorOpt.class,
                    formData.color === colorOpt.id
                      ? "scale-110 ring-2 ring-offset-2 ring-foreground/30"
                      : "hover:scale-105"
                  )}
                  title={colorOpt.label}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Fréquence</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.id} value={freq.id}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", `bg-${formData.color}/20`)}>
                <SelectedIcon className={cn("h-5 w-5", `text-${formData.color}`)} />
              </div>
              <div>
                <p className="font-medium">{formData.title || "Nom de l'habitude"}</p>
                <p className="text-xs text-muted-foreground">
                  {FREQUENCIES.find(f => f.id === formData.frequency)?.label}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {habit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HabitsSettingsSection() {
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const handleCreate = (data: HabitFormData) => {
    // Check for duplicate name
    const existingHabit = habits?.find(
      (h) => h.title.toLowerCase().trim() === data.title.toLowerCase().trim()
    );
    if (existingHabit) {
      toast.error("Une habitude avec ce nom existe déjà");
      return;
    }
    
    createHabit.mutate(
      { title: data.title, icon: data.icon, color: data.color },
      {
        onSuccess: () => setShowCreateDialog(false),
      }
    );
  };

  const handleUpdate = (data: HabitFormData) => {
    if (!editingHabit) return;
    updateHabit.mutate(
      {
        id: editingHabit.id,
        title: data.title,
        icon: data.icon,
        color: data.color,
        frequency: data.frequency,
      },
      {
        onSuccess: () => setEditingHabit(null),
      }
    );
  };

  const handleDelete = () => {
    if (!deletingHabit) return;
    deleteHabit.mutate(deletingHabit.id, {
      onSuccess: () => setDeletingHabit(null),
    });
  };

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-data/20">
              <Heart className="h-5 w-5 text-segment-data" />
            </div>
            <div>
              <h3 className="font-semibold">Gestion des Habitudes</h3>
              <p className="text-xs text-muted-foreground">
                Crée et organise tes routines quotidiennes
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-segment-data" />
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="space-y-3">
            {habits.map((habit) => {
              const IconComp = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || Check;
              const colorClass = habit.color || "segment-data";

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", `bg-${colorClass}/20`)}>
                      <IconComp className={cn("h-5 w-5", `text-${colorClass}`)} />
                    </div>
                    <div>
                      <p className="font-medium">{habit.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {FREQUENCIES.find(f => f.id === habit.frequency)?.label || "Quotidien"}
                        {" • "}
                        {habit.completed_days.length} jours complétés
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingHabit(habit)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingHabit(habit)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Aucune habitude configurée</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Crée ta première habitude pour commencer le suivi
            </p>
          </div>
        )}
      </GlassCard>

      {/* Create Dialog */}
      <HabitFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        isSubmitting={createHabit.isPending}
      />

      {/* Edit Dialog */}
      <HabitFormDialog
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        habit={editingHabit}
        onSubmit={handleUpdate}
        isSubmitting={updateHabit.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingHabit} onOpenChange={(open) => !open && setDeletingHabit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette habitude ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'habitude "{deletingHabit?.title}" et tout son historique seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteHabit.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
