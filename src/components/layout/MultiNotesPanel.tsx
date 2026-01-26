import { useState, useEffect, useRef } from "react";
import { StickyNote, Plus, Pin, PinOff, Trash2, Loader2 } from "lucide-react";
import { useNotes, useCreateNote, useUpdateNote, useToggleNotePin, useDeleteNote, Note } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

const NOTE_COLORS = [
  { id: "yellow", bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-300 dark:border-yellow-700" },
  { id: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-700" },
  { id: "green", bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-300 dark:border-green-700" },
  { id: "pink", bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-300 dark:border-pink-700" },
  { id: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-700" },
];

function NoteCard({ note }: { note: Note }) {
  const [content, setContent] = useState(note.content || "");
  const [title, setTitle] = useState(note.title || "");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const updateNote = useUpdateNote();
  const togglePin = useToggleNotePin();
  const deleteNote = useDeleteNote();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const colorConfig = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];

  useEffect(() => {
    setContent(note.content || "");
    setTitle(note.title || "");
  }, [note.content, note.title]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, content: value });
    }, 800);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateNote.mutate({ id: note.id, title: value });
    }, 800);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border p-3 transition-all duration-200",
          colorConfig.bg,
          colorConfig.border,
          note.is_pinned && "ring-2 ring-primary/50"
        )}
      >
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Titre..."
            className={cn(
              "flex-1 bg-transparent border-0 text-sm font-medium",
              "placeholder:text-muted-foreground/50 focus:outline-none",
              "text-foreground"
            )}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => togglePin.mutate({ id: note.id, is_pinned: !note.is_pinned })}
              className={cn(
                "p-1 rounded-md transition-colors",
                note.is_pinned 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={note.is_pinned ? "Désépingler" : "Épingler au Dashboard"}
            >
              {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setShowDeleteAlert(true)}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Écris ta note..."
          className={cn(
            "w-full min-h-[60px] max-h-[120px] resize-none",
            "bg-transparent border-0 text-sm",
            "placeholder:text-muted-foreground/50 focus:outline-none",
            "text-foreground"
          )}
        />

        {/* Color picker */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current/10">
          {NOTE_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => updateNote.mutate({ id: note.id, color: color.id })}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-transform",
                color.bg.replace("dark:", "").split(" ")[0],
                note.color === color.id ? "scale-125 ring-2 ring-offset-1 ring-foreground/30" : "hover:scale-110"
              )}
            />
          ))}
        </div>
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

export function MultiNotesPanel() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();

  if (isLoading) {
    return (
      <div className="mb-6 pb-4 border-b border-border/30">
        <div className="h-32 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mb-6 pb-4 border-b border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-trading text-sm text-primary flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes Rapides
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => createNote.mutate({})}
          disabled={createNote.isPending}
          className="h-7 px-2 text-xs"
        >
          {createNote.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nouvelle
            </>
          )}
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted pr-1">
        {notes && notes.length > 0 ? (
          notes.map((note) => <NoteCard key={note.id} note={note} />)
        ) : (
          <div className="text-center py-6 text-muted-foreground/60 text-sm">
            <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Aucune note</p>
            <p className="text-xs mt-1">Clique sur "Nouvelle" pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
