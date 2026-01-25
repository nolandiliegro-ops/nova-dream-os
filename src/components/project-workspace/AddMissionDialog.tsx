import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateMission } from "@/hooks/useMissions";
import { toast } from "sonner";

interface AddMissionDialogProps {
  projectId: string;
  mode: "work" | "personal";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMissionDialog({ projectId, mode, open, onOpenChange }: AddMissionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createMission = useCreateMission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createMission.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        status: "pending",
        order_index: 0,
        deadline: null,
        estimated_duration: null,
      });

      toast.success("Mission créée !");
      setTitle("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-trading">Nouvelle Mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mission-title">Titre de la mission</Label>
            <Input
              id="mission-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Phase de lancement"
              className="rounded-2xl"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission-description">Description (optionnel)</Label>
            <Textarea
              id="mission-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris les objectifs de cette mission..."
              className="rounded-2xl resize-none"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-2xl" 
            disabled={createMission.isPending || !title.trim()}
          >
            {createMission.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Créer la mission"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
