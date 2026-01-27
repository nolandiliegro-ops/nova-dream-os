import { MissionDiff, generateDiffSummary } from "@/utils/missionDiff";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, RefreshCw, Check, ArrowRight, Timer } from "lucide-react";

interface MissionDiffPreviewProps {
  diffs: MissionDiff[];
}

export function MissionDiffPreview({ diffs }: MissionDiffPreviewProps) {
  const summary = generateDiffSummary(diffs);

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="flex flex-wrap gap-2">
        {summary.toCreate > 0 && (
          <Badge variant="default" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20">
            <Plus className="h-3 w-3" />
            {summary.toCreate} à créer
          </Badge>
        )}
        {summary.toUpdate > 0 && (
          <Badge variant="default" className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
            <RefreshCw className="h-3 w-3" />
            {summary.toUpdate} à mettre à jour
          </Badge>
        )}
        {summary.identical > 0 && (
          <Badge variant="default" className="gap-1.5 bg-gray-500/10 text-gray-600 border-gray-500/20">
            <Check className="h-3 w-3" />
            {summary.identical} identique{summary.identical > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Liste des diffs */}
      <ScrollArea className="h-[300px] rounded-lg border border-border/50 bg-muted/30 p-3">
        <div className="space-y-2">
          {diffs.map((diff, idx) => (
            <DiffItem key={idx} diff={diff} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function DiffItem({ diff }: { diff: MissionDiff }) {
  if (diff.type === 'create') {
    return (
      <div className="bg-green-500/5 border border-green-500/20 rounded-md p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Plus className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-green-700 dark:text-green-400">
              {diff.parsedMission.title}
            </p>
            {diff.parsedMission.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {diff.parsedMission.description}
              </p>
            )}
            {diff.parsedMission.estimatedDuration && (
              <div className="flex items-center gap-1 mt-1.5">
                <Timer className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  {diff.parsedMission.estimatedDuration}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (diff.type === 'update') {
    return (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-md p-3 space-y-2">
        <div className="flex items-start gap-2">
          <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-blue-700 dark:text-blue-400">
              {diff.parsedMission.title}
            </p>
            
            {/* Changements */}
            <div className="mt-2 space-y-1.5">
              {diff.changes?.description && (
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Description :</p>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 line-through opacity-70 line-clamp-1">
                      {diff.changes.description.old || '(vide)'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 line-clamp-1">
                      {diff.changes.description.new}
                    </span>
                  </div>
                </div>
              )}
              
              {diff.changes?.estimatedDuration && (
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Durée estimée :</p>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400 line-through">
                      {diff.changes.estimatedDuration.old || 'Aucune'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {diff.changes.estimatedDuration.new || 'Aucune'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // identical
  return (
    <div className="bg-gray-500/5 border border-gray-500/10 rounded-md p-3">
      <div className="flex items-start gap-2">
        <Check className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-600 dark:text-gray-400">
            {diff.parsedMission.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aucun changement détecté
          </p>
        </div>
      </div>
    </div>
  );
}
