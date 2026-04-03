import type { Transaction } from "../../types";
import { roundToTwo } from "../helpers";

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}

export interface AnnualSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  balance: number;
  monthlyData: MonthlyData[];
  topCategories: { category: string; amount: number; type: string }[];
  highestMonth: { month: string; amount: number };
  lowestMonth: { month: string; amount: number };
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  savingsByCategory: Record<string, number>;
  expensesByCategoryByMonth: Record<string, Record<string, number>>;
}

export function calculateAnnualSummary(
  transactions: Transaction[],
  year: string,
): AnnualSummary {
  const yearTransactions = transactions.filter((t) => t.date.startsWith(year));

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;

  const expensesByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const savingsByCategory: Record<string, number> = {};
  const monthlyMap: Record<string, MonthlyData> = {};
  const expensesByCategoryByMonth: Record<string, Record<string, number>> = {};

  // Agrégation des données
  yearTransactions.forEach((t) => {
    const month = t.date.slice(0, 7);

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        income: 0,
        expenses: 0,
        savings: 0,
        balance: 0,
      };
    }

    if (t.type === "income") {
      totalIncome += t.amount;
      incomeByCategory[t.category] =
        (incomeByCategory[t.category] || 0) + t.amount;
      monthlyMap[month].income += t.amount;
    } else if (t.type === "expense") {
      totalExpenses += t.amount;
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
      monthlyMap[month].expenses += t.amount;

      // Track expenses by category by month
      if (!expensesByCategoryByMonth[month]) {
        expensesByCategoryByMonth[month] = {};
      }
      expensesByCategoryByMonth[month][t.category] =
        (expensesByCategoryByMonth[month][t.category] || 0) + t.amount;
    } else if (t.type === "savings") {
      totalSavings += t.amount;
      savingsByCategory[t.category] =
        (savingsByCategory[t.category] || 0) + t.amount;
      monthlyMap[month].savings += t.amount;
    }
  });

  // Calcul des balances mensuelles
  Object.values(monthlyMap).forEach((month) => {
    month.balance = roundToTwo(month.income - month.expenses - month.savings);
  });

  // Tri chronologique des mois
  const monthlyData = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  // Recherche des mois extrêmes
  const expenseMonths = monthlyData.map((m) => ({
    month: m.month,
    amount: m.expenses,
  }));

  const highestMonth =
    expenseMonths.length > 0
      ? expenseMonths.reduce((max, curr) =>
          curr.amount > max.amount ? curr : max,
        )
      : { month: "", amount: 0 };

  const lowestMonth =
    expenseMonths.length > 0
      ? expenseMonths.reduce((min, curr) =>
          curr.amount < min.amount ? curr : min,
        )
      : { month: "", amount: 0 };

  // Top catégories (tous types confondus)
  const allCategories = [
    ...Object.entries(expensesByCategory).map(([cat, amount]) => ({
      category: cat,
      amount,
      type: "expense",
    })),
    ...Object.entries(incomeByCategory).map(([cat, amount]) => ({
      category: cat,
      amount,
      type: "income",
    })),
    ...Object.entries(savingsByCategory).map(([cat, amount]) => ({
      category: cat,
      amount,
      type: "savings",
    })),
  ];

  const topCategories = allCategories
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalIncome: roundToTwo(totalIncome),
    totalExpenses: roundToTwo(totalExpenses),
    totalSavings: roundToTwo(totalSavings),
    balance: roundToTwo(totalIncome - totalExpenses - totalSavings),
    monthlyData,
    topCategories,
    highestMonth,
    lowestMonth,
    expensesByCategory,
    incomeByCategory,
    savingsByCategory,
    expensesByCategoryByMonth,
  };
}
