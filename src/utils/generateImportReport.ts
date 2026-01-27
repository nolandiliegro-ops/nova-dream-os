import { MissionDiff } from "./missionDiff";

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
  diffs: MissionDiff[];
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
  const createdDiffs = diffs.filter(d => d.type === 'create');
  if (createdDiffs.length > 0) {
    report += `## 🟢 MISSIONS CRÉÉES (${createdDiffs.length})\n\n`;
    createdDiffs.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.parsedMission.title}\n\n`;
      if (diff.parsedMission.description) {
        report += `**Description :** ${diff.parsedMission.description}\n\n`;
      }
      if (diff.parsedMission.estimatedDuration) {
        report += `**Durée estimée :** ${diff.parsedMission.estimatedDuration}\n\n`;
      }
    });
    report += `---\n\n`;
  }

  // Missions modifiées
  const updatedDiffs = diffs.filter(d => d.type === 'update');
  if (updatedDiffs.length > 0) {
    report += `## 🔵 MISSIONS MODIFIÉES (${updatedDiffs.length})\n\n`;
    updatedDiffs.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.parsedMission.title}\n\n`;
      
      // Afficher les changements
      if (diff.changes) {
        if (diff.changes.description) {
          report += `**Description :**\n`;
          report += `- ❌ Avant : ${diff.changes.description.old || 'N/A'}\n`;
          report += `- ✅ Après : ${diff.changes.description.new || 'N/A'}\n\n`;
        }
        if (diff.changes.estimatedDuration) {
          report += `**Durée estimée :**\n`;
          report += `- ❌ Avant : ${diff.changes.estimatedDuration.old || 'N/A'}\n`;
          report += `- ✅ Après : ${diff.changes.estimatedDuration.new || 'N/A'}\n\n`;
        }
      }
    });
    report += `---\n\n`;
  }

  // Missions identiques
  const identicalDiffs = diffs.filter(d => d.type === 'identical');
  if (identicalDiffs.length > 0) {
    report += `## ⚪ MISSIONS IDENTIQUES (${identicalDiffs.length})\n\n`;
    identicalDiffs.forEach(diff => {
      report += `- ${diff.parsedMission.title}\n`;
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
