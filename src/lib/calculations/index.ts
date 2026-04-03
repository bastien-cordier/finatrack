import type { Transaction, MonthlyResume } from "../../types";
import { roundToTwo, calculatePercentage } from "../helpers";

/**
 * Calcule les pourcentages pour chaque catégorie
 */
function calculateCategoryPercentages(
  byCategory: Record<string, number>,
  total: number,
): Record<string, number> {
  const percentages: Record<string, number> = {};
  Object.keys(byCategory).forEach((cat) => {
    percentages[cat] = calculatePercentage(byCategory[cat], total);
  });
  return percentages;
}

export function calculateMonthlySummary(
  transactions: Transaction[],
): MonthlyResume {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  const expensesByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const savingsByCategory: Record<string, number> = {};

  // Agrégation des transactions par type et catégorie
  transactions.forEach((t) => {
    if (t.type === "expense") {
      totalExpenses += t.amount;
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    } else if (t.type === "income") {
      totalIncome += t.amount;
      incomeByCategory[t.category] =
        (incomeByCategory[t.category] || 0) + t.amount;
    } else if (t.type === "savings") {
      totalSavings += t.amount;
      savingsByCategory[t.category] =
        (savingsByCategory[t.category] || 0) + t.amount;
    }
  });

  return {
    totalIncome: roundToTwo(totalIncome),
    totalExpenses: roundToTwo(totalExpenses),
    totalSavings: roundToTwo(totalSavings),
    balance: roundToTwo(totalIncome - totalExpenses - totalSavings),
    expensesByCategory,
    expensePercentages: calculateCategoryPercentages(
      expensesByCategory,
      totalExpenses,
    ),
    incomeByCategory,
    incomePercentages: calculateCategoryPercentages(
      incomeByCategory,
      totalIncome,
    ),
    savingsByCategory,
    savingsPercentages: calculateCategoryPercentages(
      savingsByCategory,
      totalSavings,
    ),
  };
}

/**
 * Calcule la répartition des dépenses communes entre 2 personnes
 * Retourne la ventilation des dépenses partagées uniquement
 */
export function calculateSharedSplit(
  transactions: Transaction[],
  splitPercentages: Record<string, number>,
) {
  let sharedTotal = 0;
  const sharedByCategory: Record<string, number> = {};
  const paidByPerson: Record<string, number> = {};

  // Agrégation des dépenses communes
  transactions.forEach((t) => {
    if (t.type === "expense" && t.isShared) {
      sharedTotal += t.amount;
      sharedByCategory[t.category] =
        (sharedByCategory[t.category] || 0) + t.amount;

      if (t.paidBy) {
        paidByPerson[t.paidBy] = (paidByPerson[t.paidBy] || 0) + t.amount;
      }
    }
  });

  // Calcul de ce que chaque personne devrait payer
  const shouldPay: Record<string, number> = {};
  const balance: Record<string, number> = {};

  Object.keys(splitPercentages).forEach((personId) => {
    shouldPay[personId] = roundToTwo(
      (sharedTotal * splitPercentages[personId]) / 100,
    );
    const paid = paidByPerson[personId] || 0;
    balance[personId] = roundToTwo(paid - shouldPay[personId]);
  });

  return {
    sharedTotal: roundToTwo(sharedTotal),
    sharedByCategory,
    paidByPerson,
    shouldPay,
    balance,
  };
}
