/**
 * Utilitaire de parsing de dates en français
 * Convertit les expressions naturelles en dates ISO (YYYY-MM-DD)
 */

export function parseFrenchDate(text: string): string | null {
  const today = new Date();
  const lowerText = text.toLowerCase();

  // Jours de la semaine en français
  const daysOfWeek = [
    'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
  ];

  // Aujourd'hui
  if (lowerText.includes('aujourd\'hui') || lowerText.includes('aujourdhui')) {
    return formatDate(today);
  }

  // Demain
  if (lowerText.includes('demain')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Après-demain
  if (lowerText.includes('après-demain') || lowerText.includes('apres-demain')) {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    return formatDate(dayAfterTomorrow);
  }

  // Dans X jours
  const dansXJoursMatch = lowerText.match(/dans (\d+) jours?/);
  if (dansXJoursMatch) {
    const days = parseInt(dansXJoursMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    return formatDate(futureDate);
  }

  // Jours de la semaine (lundi, mardi, etc.)
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    
    // Vérifier si le jour est mentionné
    const regex = new RegExp(`\\b${dayName}\\b`, 'i');
    if (regex.test(lowerText)) {
      const targetDay = i;
      const currentDay = today.getDay();
      
      // Calculer le nombre de jours jusqu'au prochain jour cible
      let daysUntilTarget = targetDay - currentDay;
      
      // Si le jour est déjà passé cette semaine, aller à la semaine prochaine
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      
      // Vérifier si "prochain" est mentionné
      if (lowerText.includes('prochain') || lowerText.includes('prochaine')) {
        // Si "prochain" est mentionné et que le jour est aujourd'hui ou demain, aller à la semaine suivante
        if (daysUntilTarget <= 1) {
          daysUntilTarget += 7;
        }
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return formatDate(targetDate);
    }
  }

  // Dates explicites (30 janvier, 1er février, etc.)
  const dateMatch = lowerText.match(/(\d{1,2})\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthName = dateMatch[2].toLowerCase();
    
    const months: { [key: string]: number } = {
      'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3,
      'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7, 'aout': 7,
      'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11
    };
    
    const month = months[monthName];
    if (month !== undefined) {
      const year = today.getFullYear();
      const targetDate = new Date(year, month, day);
      
      // Si la date est dans le passé, utiliser l'année prochaine
      if (targetDate < today) {
        targetDate.setFullYear(year + 1);
      }
      
      return formatDate(targetDate);
    }
  }

  // Aucune date détectée
  return null;
}

/**
 * Formate une date en YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Remplace les expressions de dates dans un texte par leur équivalent ISO
 */
export function replaceDatesInText(text: string): string {
  const parsedDate = parseFrenchDate(text);
  
  if (!parsedDate) {
    return text;
  }
  
  // Ajouter la date ISO à la fin du texte si elle n'est pas déjà présente
  if (!text.includes(parsedDate)) {
    return `${text} (date: ${parsedDate})`;
  }
  
  return text;
}
