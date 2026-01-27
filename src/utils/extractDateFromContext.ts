/**
 * Extrait la date du contexte d'un message contenant "(date: YYYY-MM-DD)"
 * 
 * Exemple :
 * "creer tache appeller maman samedi a midi (date: 2026-01-31)"
 * → "2026-01-31"
 */
export function extractDateFromContext(content: string): string | null {
  // Chercher le pattern (date: YYYY-MM-DD)
  const dateMatch = content.match(/\(date:\s*(\d{4}-\d{2}-\d{2})\)/i);
  
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1];
  }
  
  return null;
}

/**
 * Extrait la date du contexte et la retourne, sinon retourne la date du jour
 */
export function extractDateOrToday(content: string): string {
  const extractedDate = extractDateFromContext(content);
  
  if (extractedDate) {
    return extractedDate;
  }
  
  // Retourner la date du jour par défaut
  return new Date().toISOString().split('T')[0];
}
