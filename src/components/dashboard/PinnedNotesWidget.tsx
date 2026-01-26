import { StickyNote, Pin, Trash2, ExternalLink } from "lucide-react";
import { usePinnedNotes, useDeleteNote, Note } from "@/hooks/useNotes";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { useState } from "react";
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

const NOTE_COLORS: Record<string, { bg: string; shadow: string }> = {
  yellow: { 
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20",
    shadow: "shadow-yellow-200/50 dark:shadow-yellow-900/30"
  },
  blue: { 
    bg: "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20",
    shadow: "shadow-blue-200/50 dark:shadow-blue-900/30"
  },
  green: { 
    bg: "bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20",
    shadow: "shadow-green-200/50 dark:shadow-green-900/30"
  },
  pink: { 
    bg: "bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-800/20",
    shadow: "shadow-pink-200/50 dark:shadow-pink-900/30"
  },
  purple: { 
    bg: "bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20",
    shadow: "shadow-purple-200/50 dark:shadow-purple-900/30"
  },
};

function PinnedNoteCard({ note }: { note: Note }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const deleteNote = useDeleteNote();
  const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

  return (
    <>
      <div
        className={cn(
          "relative rounded-xl p-4 transition-all duration-300",
          "hover:scale-[1.02] hover:-rotate-1",
          "shadow-lg",
          colorConfig.bg,
          colorConfig.shadow
        )}
        style={{
          transform: `rotate(${Math.random() * 4 - 2}deg)`,
        }}
      >
        {/* Pin icon */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteAlert(true)}
          className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Title */}
        <h4 className="font-medium text-sm text-foreground mb-1 pr-6 line-clamp-1">
          {note.title || "Sans titre"}
        </h4>

        {/* Content */}
        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {note.content || "Aucun contenu"}
        </p>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNote.mutate(note.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PinnedNotesWidget() {
  const { data: pinnedNotes, isLoading } = usePinnedNotes();

  if (isLoading) {
    return (
      <GlassCard className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/30 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-muted/20 rounded-xl" />
            <div className="h-24 bg-muted/20 rounded-xl" />
          </div>
        </div>
      </GlassCard>
    );
  }

  const hasNotes = pinnedNotes && pinnedNotes.length > 0;

  return (
    <GlassCard className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" />
          Notes Épinglées
        </h3>
        {hasNotes && (
          <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
            {pinnedNotes.length} note{pinnedNotes.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Notes Grid */}
      {hasNotes ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 group">
          {pinnedNotes.map((note) => (
            <PinnedNoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-3">
            <StickyNote className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Aucune note épinglée</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Épingle des notes depuis le panneau latéral
          </p>
        </div>
      )}
    </GlassCard>
  );
}
