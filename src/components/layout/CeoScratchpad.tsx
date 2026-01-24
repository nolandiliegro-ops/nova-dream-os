import { useState, useEffect } from "react";
import { StickyNote, Save } from "lucide-react";
import { useNote, useUpdateNote } from "@/hooks/useNote";
import { cn } from "@/lib/utils";

export function CeoScratchpad() {
  const { data: savedContent, isLoading } = useNote();
  const { debouncedSave, isPending } = useUpdateNote();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (savedContent !== undefined) {
      setContent(savedContent);
    }
  }, [savedContent]);

  const handleChange = (value: string) => {
    setContent(value);
    debouncedSave(value);
  };

  if (isLoading) {
    return (
      <div className="mb-6 pb-4 border-b border-border/30">
        <div className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mb-6 pb-4 border-b border-border/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-trading text-sm text-primary flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes Rapides
        </h3>
        {isPending && (
          <Save className="h-3 w-3 text-muted-foreground animate-pulse" />
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Idées, rappels, thoughts..."
        className={cn(
          "w-full min-h-[80px] max-h-[150px] resize-none",
          "bg-transparent border-0 rounded-2xl p-3",
          "text-sm text-foreground placeholder:text-muted-foreground/50",
          "focus:outline-none focus:ring-1 focus:ring-primary/30",
          "scrollbar-thin scrollbar-thumb-muted"
        )}
      />
    </div>
  );
}
