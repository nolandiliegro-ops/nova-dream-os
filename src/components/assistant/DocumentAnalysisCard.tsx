import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Calendar, Building2, Sparkles, Loader2 } from "lucide-react";
import type { AnalysisResult } from "@/hooks/useDocumentAnalysis";

interface DocumentAnalysisCardProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
  latestDocumentName?: string | null;
}

export function DocumentAnalysisCard({
  analysis,
  isLoading,
  onAnalyze,
  latestDocumentName,
}: DocumentAnalysisCardProps) {
  if (isLoading) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold">Analyse en cours...</h3>
            <p className="text-xs text-muted-foreground">Nova lit le document</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
        </div>
      </GlassCard>
    );
  }

  if (analysis) {
    const { analysis: data, documentName, documentSegment } = analysis;
    
    return (
      <GlassCard className="p-5 border-primary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
            <FileText className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{documentName}</h3>
            <p className="text-xs text-muted-foreground">
              {documentSegment} • {data.documentType}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 p-3 rounded-lg bg-muted/30">
          <p className="text-sm">{data.summary}</p>
        </div>

        {/* Extracted Data */}
        <div className="space-y-3">
          {/* Amounts */}
          {data.extractedData.amounts.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Montants détectés
              </div>
              <div className="flex flex-wrap gap-2">
                {data.extractedData.amounts.map((amount, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium"
                  >
                    {amount.value.toLocaleString("fr-FR")} {amount.currency}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          {data.extractedData.dates.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Dates clés
              </div>
              <div className="flex flex-wrap gap-2">
                {data.extractedData.dates.map((date, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs font-medium"
                  >
                    {date.date}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entities */}
          {data.extractedData.entities.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                Entités identifiées
              </div>
              <div className="flex flex-wrap gap-2">
                {data.extractedData.entities.map((entity, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 text-xs font-medium"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Action */}
        {data.suggestedAction && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Action suggérée</span>
            </div>
            <p className="text-sm">{data.suggestedAction}</p>
          </div>
        )}
      </GlassCard>
    );
  }

  // Default state - show analyze button
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Analyse documentaire</h3>
          <p className="text-xs text-muted-foreground">OCR & extraction IA</p>
        </div>
      </div>

      {latestDocumentName ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Dernier document : <span className="font-medium text-foreground">{latestDocumentName}</span>
          </p>
          <Button onClick={onAnalyze} className="w-full" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyser ce document
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Aucun document dans le coffre-fort
        </p>
      )}
    </GlassCard>
  );
}
