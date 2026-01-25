import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Sparkles } from "lucide-react";
import { useCreateMissionsFromTemplate } from "@/hooks/useMissions";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface BulkImportMissionDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parseRoadmapText = (text: string): string[] => {
  return text
    .split('\n')
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
};

const triggerBulkCelebration = (count: number) => {
  const duration = count > 5 ? 3000 : 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: count > 5 ? 5 : 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b'],
    });
    confetti({
      particleCount: count > 5 ? 5 : 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export function BulkImportMissionDialog({
  projectId,
  open,
  onOpenChange,
}: BulkImportMissionDialogProps) {
  const [rawText, setRawText] = useState("");
  const createMissions = useCreateMissionsFromTemplate();

  const parsedMissions = useMemo(() => parseRoadmapText(rawText), [rawText]);

  const handleSubmit = async () => {
    if (parsedMissions.length === 0) return;

    try {
      await createMissions.mutateAsync({
        projectId,
        missions: parsedMissions.map(title => ({
          title,
          description: "",
        })),
      });

      const count = parsedMissions.length;
      toast.success(`${count} mission${count > 1 ? 's' : ''} créée${count > 1 ? 's' : ''} !`);

      if (count > 3) {
        triggerBulkCelebration(count);
      }

      setRawText("");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'import");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Rapide de Roadmap
          </DialogTitle>
          <DialogDescription>
            Colle ta liste de missions. Chaque ligne devient une mission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Colle ta roadmap ici...

Exemples de format :
- Phase de recherche
- Développement MVP
- Tests utilisateurs
- Lancement beta
- Marketing et acquisition

Chaque ligne = 1 mission`}
            className="min-h-[200px] font-mono text-sm"
          />

          {parsedMissions.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="text-primary font-semibold">{parsedMissions.length}</span>
                {" "}mission{parsedMissions.length > 1 ? 's' : ''} détectée{parsedMissions.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={parsedMissions.length === 0 || createMissions.isPending}
            className="gap-2"
          >
            {createMissions.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Générer la Roadmap
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
