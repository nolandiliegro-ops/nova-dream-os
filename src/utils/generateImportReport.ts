import { MissionDiffResult } from "./missionDiff";

export interface ImportReportData {
  projectName: string;
  importDate: Date;
  importedBy: string;
  summary: {
    created: number;
    updated: number;
    identical: number;
    total: number;
  };
  diffs: MissionDiffResult[];
}

/**
 * Génère un rapport d'import de roadmap au format Markdown
 */
export function generateImportReport(data: ImportReportData): string {
  const { projectName, importDate, importedBy, summary, diffs } = data;
  
  const dateStr = importDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let report = `# 📊 Rapport d'Import de Roadmap\n\n`;
  report += `**Projet :** ${projectName}  \n`;
  report += `**Date :** ${dateStr}  \n`;
  report += `**Importé par :** ${importedBy}\n\n`;
  report += `---\n\n`;

  // Résumé
  report += `## 🎯 Résumé\n\n`;
  report += `| Action | Nombre | Détails |\n`;
  report += `|--------|--------|----------|\n`;
  report += `| 🟢 Créées | ${summary.created} | Nouvelles missions ajoutées |\n`;
  report += `| 🔵 Modifiées | ${summary.updated} | Missions existantes mises à jour |\n`;
  report += `| ⚪ Identiques | ${summary.identical} | Aucune modification |\n`;
  report += `| **TOTAL** | **${summary.total}** | **Missions traitées** |\n\n`;
  report += `---\n\n`;

  // Missions créées
  const createdDiffs = diffs.filter(d => d.action === 'create');
  if (createdDiffs.length > 0) {
    report += `## 🟢 MISSIONS CRÉÉES (${createdDiffs.length})\n\n`;
    createdDiffs.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.newMission!.title}\n\n`;
      if (diff.newMission!.description) {
        report += `**Description :** ${diff.newMission!.description}\n\n`;
      }
      report += `**Durée estimée :** ${diff.newMission!.estimated_time}h  \n`;
      report += `**Ordre :** ${diff.newMission!.order}\n\n`;
    });
    report += `---\n\n`;
  }

  // Missions modifiées
  const updatedDiffs = diffs.filter(d => d.action === 'update');
  if (updatedDiffs.length > 0) {
    report += `## 🔵 MISSIONS MODIFIÉES (${updatedDiffs.length})\n\n`;
    updatedDiffs.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.newMission!.title}\n\n`;
      
      // Afficher les changements
      if (diff.changes && diff.changes.length > 0) {
        diff.changes.forEach(change => {
          report += `**${change.field} :**\n`;
          report += `- ❌ Avant : ${change.oldValue || 'N/A'}\n`;
          report += `- ✅ Après : ${change.newValue || 'N/A'}\n\n`;
        });
      }
    });
    report += `---\n\n`;
  }

  // Missions identiques
  const identicalDiffs = diffs.filter(d => d.action === 'skip');
  if (identicalDiffs.length > 0) {
    report += `## ⚪ MISSIONS IDENTIQUES (${identicalDiffs.length})\n\n`;
    identicalDiffs.forEach(diff => {
      report += `- ${diff.newMission!.title}\n`;
    });
    report += `\n---\n\n`;
  }

  // Footer
  report += `**Rapport généré automatiquement par Nova Dream OS**\n`;

  return report;
}

/**
 * Génère un titre pour le document de rapport
 */
export function generateReportTitle(projectName: string, importDate: Date): string {
  const dateStr = importDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-').replace(/:/g, 'h');
  
  return `📊 Import Roadmap - ${projectName} - ${dateStr}`;
}
