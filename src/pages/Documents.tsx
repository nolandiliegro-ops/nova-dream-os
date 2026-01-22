import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload, FolderOpen, File, Image, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const segmentColors: Record<string, string> = {
  ecommerce: "border-l-segment-ecommerce",
  tiktok: "border-l-segment-tiktok",
  consulting: "border-l-segment-consulting",
  oracle: "border-l-segment-oracle",
  personal: "border-l-muted-foreground",
};

// Placeholder documents
const documents = [
  { id: 1, name: "Facture Client Alpha - Jan 2026", type: "pdf", segment: "consulting", size: "245 KB", date: "2026-01-20" },
  { id: 2, name: "Rapport Ventes Q4 2025", type: "spreadsheet", segment: "ecommerce", size: "1.2 MB", date: "2026-01-15" },
  { id: 3, name: "Contrat Partenariat TikTok", type: "pdf", segment: "tiktok", size: "890 KB", date: "2026-01-10" },
  { id: 4, name: "Certification Oracle Cloud", type: "image", segment: "oracle", size: "2.1 MB", date: "2025-12-20" },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  image: Image,
  default: File,
};

export default function Documents() {
  const { mode } = useMode();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Documents <span className="text-gradient">& Coffre-fort</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Tes documents business sécurisés" : "Tes documents personnels"}
            </p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Uploader
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">Dossiers</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-ecommerce/20">
                <FileSpreadsheet className="h-5 w-5 text-segment-ecommerce" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.4 MB</p>
                <p className="text-xs text-muted-foreground">Espace utilisé</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">5 GB</p>
                <p className="text-xs text-muted-foreground">Espace disponible</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Folders */}
        <div className="grid gap-4 md:grid-cols-4">
          {["E-commerce", "TikTok", "Consulting", "Oracle"].map((folder, i) => {
            const segments = ["ecommerce", "tiktok", "consulting", "oracle"];
            const colors = ["segment-ecommerce", "segment-tiktok", "segment-consulting", "segment-oracle"];
            
            return (
              <GlassCard 
                key={folder}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:scale-[1.02]",
                  `border-l-4 border-l-${colors[i]}`
                )}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className={`h-8 w-8 text-${colors[i]}`} />
                  <div>
                    <p className="font-medium">{folder}</p>
                    <p className="text-xs text-muted-foreground">
                      {documents.filter(d => d.segment === segments[i]).length} fichiers
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Documents List */}
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold">Documents récents</h3>
          <div className="space-y-3">
            {documents.map((doc) => {
              const Icon = typeIcons[doc.type] || typeIcons.default;
              
              return (
                <div 
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 cursor-pointer",
                    segmentColors[doc.segment]
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(doc.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Upload Zone */}
        <GlassCard className="p-8 border-2 border-dashed border-muted-foreground/30">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Dépose tes fichiers ici</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique sur le bouton "Uploader" · PDF, Images, Excel supportés
            </p>
            <Button variant="outline">
              Parcourir les fichiers
            </Button>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
