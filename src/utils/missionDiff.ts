/**
 * Utilitaire de détection de doublons et diff pour les missions
 */

import { Mission } from "@/hooks/useMissions";

export interface ParsedMission {
  title: string;
  description: string;
  estimatedDuration: string | null;
}

export interface MissionDiff {
  type: 'create' | 'update' | 'identical';
  parsedMission: ParsedMission;
  existingMission?: Mission;
  changes?: {
    description?: { old: string; new: string };
    estimatedDuration?: { old: string | null; new: string | null };
  };
}

/**
 * Normalise un titre pour la comparaison (insensible à la casse, espaces, ponctuation)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Supprime la ponctuation
    .replace(/\s+/g, ' '); // Normalise les espaces
}

/**
 * Calcule la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
 * Retourne un score entre 0 (totalement différent) et 1 (identique)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Trouve une mission existante correspondant à une mission parsée
 * Retourne la mission si trouvée, sinon null
 */
function findMatchingMission(
  parsedMission: ParsedMission,
  existingMissions: Mission[]
): Mission | null {
  const normalizedParsedTitle = normalizeTitle(parsedMission.title);
  
  // Recherche exacte (après normalisation)
  for (const existing of existingMissions) {
    const normalizedExistingTitle = normalizeTitle(existing.title);
    if (normalizedParsedTitle === normalizedExistingTitle) {
      return existing;
    }
  }
  
  // Recherche par similarité (seuil de 85%)
  let bestMatch: Mission | null = null;
  let bestScore = 0;
  
  for (const existing of existingMissions) {
    const score = calculateSimilarity(
      normalizedParsedTitle,
      normalizeTitle(existing.title)
    );
    
    if (score > bestScore && score >= 0.85) {
      bestScore = score;
      bestMatch = existing;
    }
  }
  
  return bestMatch;
}

/**
 * Détecte les changements entre une mission parsée et une mission existante
 */
function detectChanges(
  parsedMission: ParsedMission,
  existingMission: Mission
): MissionDiff['changes'] | undefined {
  const changes: MissionDiff['changes'] = {};
  
  // Comparaison de la description
  const parsedDesc = parsedMission.description.trim();
  const existingDesc = (existingMission.description || '').trim();
  
  if (parsedDesc !== existingDesc && parsedDesc.length > 0) {
    changes.description = {
      old: existingDesc,
      new: parsedDesc,
    };
  }
  
  // Comparaison de la durée estimée
  const parsedDuration = parsedMission.estimatedDuration;
  const existingDuration = existingMission.estimated_duration;
  
  if (parsedDuration !== existingDuration) {
    changes.estimatedDuration = {
      old: existingDuration,
      new: parsedDuration,
    };
  }
  
  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Compare les missions parsées avec les missions existantes
 * Retourne un tableau de diffs avec les actions à effectuer
 */
export function compareMissions(
  parsedMissions: ParsedMission[],
  existingMissions: Mission[]
): MissionDiff[] {
  const diffs: MissionDiff[] = [];
  
  for (const parsedMission of parsedMissions) {
    const matchingMission = findMatchingMission(parsedMission, existingMissions);
    
    if (!matchingMission) {
      // Nouvelle mission à créer
      diffs.push({
        type: 'create',
        parsedMission,
      });
    } else {
      // Mission existante : vérifier les changements
      const changes = detectChanges(parsedMission, matchingMission);
      
      if (changes) {
        // Mission à mettre à jour
        diffs.push({
          type: 'update',
          parsedMission,
          existingMission: matchingMission,
          changes,
        });
      } else {
        // Mission identique (ignorer)
        diffs.push({
          type: 'identical',
          parsedMission,
          existingMission: matchingMission,
        });
      }
    }
  }
  
  return diffs;
}

/**
 * Génère un résumé des actions à effectuer
 */
export function generateDiffSummary(diffs: MissionDiff[]): {
  toCreate: number;
  toUpdate: number;
  identical: number;
  total: number;
} {
  return {
    toCreate: diffs.filter(d => d.type === 'create').length,
    toUpdate: diffs.filter(d => d.type === 'update').length,
    identical: diffs.filter(d => d.type === 'identical').length,
    total: diffs.length,
  };
}
