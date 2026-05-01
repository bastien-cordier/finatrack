// ============================================
// CONSTANTES
// ============================================

export const MAX_PERSON_NAME_LENGTH = 50;

export const CHART_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#e11d48",
] as const;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Arrondit un nombre à 2 décimales
 */
export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calcule un pourcentage et l'arrondit à 1 décimale
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Formate une date au format français (ex: "01/03/2026")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate un mois au format français (ex: "mars 2026")
 */
export function formatMonth(monthString: string): string {
  const date = new Date(monthString + "-01");
  const formatted = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formate un mois court pour les graphiques (ex: "mars")
 */
export function formatMonthShort(monthString: string): string {
  return new Date(monthString + "-01").toLocaleDateString("fr-FR", {
    month: "short",
  });
}

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Obtient les initiales d'un nom (pour les avatars)
 */
export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Génère un ID unique cryptographiquement aléatoire
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Calcule le pourcentage de changement entre deux valeurs
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
