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
import { Loader2, FileText, Sparkles, Target, Timer } from "lucide-react";
import { useMissions } from "@/hooks/useMissions";
import { useBulkUpdateMissions } from "@/hooks/useBulkUpdateMissions";
import { compareMissions, generateDiffSummary } from "@/utils/missionDiff";
import { MissionDiffPreview } from "./MissionDiffPreview";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useSaveImportReport } from "@/hooks/useSaveImportReport";
import { generateImportReport, generateReportTitle } from "@/utils/generateImportReport";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/hooks/useProjects";

interface ParsedMission {
  title: string;
  description: string;
  estimatedDuration: string | null;
}

interface BulkImportMissionDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cleanDescription = (lines: string[]): string => {
  return lines
    .map(line => line
      .replace(/^[-•*]\s*/, '')
      .replace(/^\s{2,}/, '')
      .trim()
    )
    .filter(line => line.length > 0)
    .join('\n');
};

/**
 * Extract duration from text
 * Supports: "3h", "2j", "45min", "Estimation: 3h", "Durée: 2 jours", etc.
 */
const extractDuration = (text: string): string | null => {
  const patterns = [
    /estimation\s*:\s*(\d+\s*[hjm]\w*)/i,
    /durée\s*:\s*(\d+\s*[hjm]\w*)/i,
    /temps\s*:\s*(\d+\s*[hjm]\w*)/i,
    /(\d+)\s*h(?:eure)?s?\b/i,
    /(\d+)\s*j(?:our)?s?\b/i,
    /(\d+)\s*min(?:ute)?s?\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the matched duration
      const duration = match[1] || match[0];
      return duration.toLowerCase().replace(/\s+/g, '').replace(/(heures?|jours?|minutes?)/gi, (m) => {
        if (m.toLowerCase().startsWith('h')) return 'h';
        if (m.toLowerCase().startsWith('j')) return 'j';
        return 'min';
      });
    }
  }
  return null;
};

const parseStructuredRoadmap = (text: string): ParsedMission[] => {
  const lines = text.split('\n');
  const missions: ParsedMission[] = [];
  
  // Regex pour détecter les titres structurés
  const titlePatterns = [
    /^(\d+\.?\d*\.?\s+)(.+)$/,           // 4.1 Titre, 1. Titre
    /^(#{1,3}\s+)(.+)$/,                  // # Titre, ## Titre
  ];
  
  let currentMission: ParsedMission | null = null;
  let descriptionBuffer: string[] = [];
  let hasStructuredFormat = false;
  
  // Première passe : détecter si le texte a un format structuré
  for (const line of lines) {
    const trimmedLine = line.trim();
    for (const pattern of titlePatterns) {
      if (pattern.test(trimmedLine)) {
        hasStructuredFormat = true;
        break;
      }
    }
    if (hasStructuredFormat) break;
  }
  
  // Si pas de format structuré, utiliser le parsing simple
  if (!hasStructuredFormat) {
    return text
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .map(title => ({ title, description: '', estimatedDuration: null }));
  }
  
  // Parsing structuré
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Vérifie si c'est un titre numéroté
    let isTitle = false;
    let cleanTitle = trimmedLine;
    
    for (const pattern of titlePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        isTitle = true;
        cleanTitle = match[2].trim();
        break;
      }
    }
    
    if (isTitle && cleanTitle.length < 150) {
      // Sauvegarde la mission précédente avec duration extraction
      if (currentMission) {
        const fullText = descriptionBuffer.join('\n');
        currentMission.description = cleanDescription(descriptionBuffer);
        currentMission.estimatedDuration = extractDuration(fullText);
        missions.push(currentMission);
      }
      
      // Nouvelle mission
      currentMission = { title: cleanTitle, description: '', estimatedDuration: null };
      descriptionBuffer = [];
    } else if (currentMission) {
      // Ajoute à la description courante
      descriptionBuffer.push(trimmedLine);
    }
  }
  
  // N'oublie pas la dernière mission
  if (currentMission) {
    const fullText = descriptionBuffer.join('\n');
    currentMission.description = cleanDescription(descriptionBuffer);
    currentMission.estimatedDuration = extractDuration(fullText);
    missions.push(currentMission);
  }
  
  return missions;
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
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const bulkUpdateMissions = useBulkUpdateMissions();
  const { data: existingMissions = [] } = useMissions(projectId);
  const { user } = useAuth();
  const saveImportReport = useSaveImportReport();
  const { data: project } = useProject(projectId);

  const parsedMissions = useMemo(() => parseStructuredRoadmap(rawText), [rawText]);
  
  const diffs = useMemo(() => {
    if (parsedMissions.length === 0) return [];
    return compareMissions(parsedMissions, existingMissions);
  }, [parsedMissions, existingMissions]);
  
  const diffSummary = useMemo(() => generateDiffSummary(diffs), [diffs]);

  const handleAnalyze = () => {
    if (parsedMissions.length === 0) return;
    setShowDiffPreview(true);
  };
  
  const handleSubmit = async () => {
    if (diffs.length === 0) return;

    try {
      const result = await bulkUpdateMissions.mutateAsync({
        projectId,
        diffs,
      });

      const messages: string[] = [];
      if (result.created > 0) {
        messages.push(`${result.created} mission${result.created > 1 ? 's' : ''} créée${result.created > 1 ? 's' : ''}`);
      }
      if (result.updated > 0) {
        messages.push(`${result.updated} mission${result.updated > 1 ? 's' : ''} mise${result.updated > 1 ? 's' : ''} à jour`);
      }
      
      toast.success(messages.join(' • '));

      if (result.created + result.updated > 3) {
        triggerBulkCelebration(result.created + result.updated);
      }

      // Générer et sauvegarder le rapport automatiquement
      if (user) {
        const importDate = new Date();
        const projectName = project?.name || projectId;
        const reportTitle = generateReportTitle(projectName, importDate);
        const reportContent = generateImportReport({
          projectName,
          importDate,
          importedBy: user.email || 'Utilisateur',
          summary: {
            created: result.created,
            updated: result.updated,
            identical: diffs.filter(d => d.type === 'identical').length,
            total: diffs.length,
          },
          diffs,
        });

        await saveImportReport.mutateAsync({
          projectId,
          reportTitle,
          reportContent,
          userId: user.id,
        });
      }

      setRawText("");
      setShowDiffPreview(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'import (bulk + rapport éventuel):", error);
      toast.error("Erreur lors de l'import");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Intelligent de Roadmap
          </DialogTitle>
          <DialogDescription>
            Colle ton cahier des charges. Les sections numérotées (4.1, 4.2...) deviennent des missions avec leurs descriptions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Colle ton cahier des charges structuré...

Formats reconnus :
4.1 Gestion des utilisateurs
• Authentification sécurisée
• Profils personnalisables
• Système de rôles
Priorité : Haute

4.2 Tableau de bord
Dashboard avec métriques clés
Graphiques de performance

Chaque section numérotée = 1 mission avec sa description`}
            className="min-h-[280px] font-mono text-sm"
          />

          {parsedMissions.length > 0 && !showDiffPreview && (
            <div className="space-y-3">
              {/* Compteur */}
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  <span className="text-primary font-semibold">{parsedMissions.length}</span>
                  {" "}mission{parsedMissions.length > 1 ? 's' : ''} détectée{parsedMissions.length > 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Preview des 2 premières missions */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aperçu
                </p>
                {parsedMissions.slice(0, 2).map((mission, idx) => (
                  <div key={idx} className="bg-background/80 rounded-md p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm flex items-center gap-2 min-w-0">
                        <Target className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{mission.title}</span>
                      </p>
                      {mission.estimatedDuration && (
                        <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Timer className="h-3 w-3" />
                          {mission.estimatedDuration}
                        </span>
                      )}
                    </div>
                    {mission.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
                        {mission.description.substring(0, 120)}
                        {mission.description.length > 120 ? '...' : ''}
                      </p>
                    )}
                  </div>
                ))}
                {parsedMissions.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    + {parsedMissions.length - 2} autre{parsedMissions.length > 3 ? 's' : ''} mission{parsedMissions.length > 3 ? 's' : ''}...
                  </p>
                )}
              </div>
            </div>
          )}
          
          {showDiffPreview && diffs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Analyse des changements</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiffPreview(false)}
                >
                  Modifier
                </Button>
              </div>
              <MissionDiffPreview diffs={diffs} />
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
          {!showDiffPreview ? (
            <Button
              onClick={handleAnalyze}
              disabled={parsedMissions.length === 0}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Analyser les changements
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={diffs.length === 0 || bulkUpdateMissions.isPending}
              className="gap-2"
            >
              {bulkUpdateMissions.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Application...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Appliquer ({diffSummary.toCreate + diffSummary.toUpdate} action{diffSummary.toCreate + diffSummary.toUpdate > 1 ? 's' : ''})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
