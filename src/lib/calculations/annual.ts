import type { Transaction } from "../../types";

export interface MonthlyData {
  month: string; // "2026-01"
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
}

export function calculateAnnualSummary(
  transactions: Transaction[],
  year: string,
): AnnualSummary {
  // Filter transactions for this year
  const yearTransactions = transactions.filter((t) => t.date.startsWith(year));

  // Initialize totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;

  // Group by category
  const expensesByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const savingsByCategory: Record<string, number> = {};

  // Group by month
  const monthlyMap: Record<string, MonthlyData> = {};

  yearTransactions.forEach((t) => {
    const month = t.date.slice(0, 7); // "2026-01"

    // Initialize month if needed
    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        income: 0,
        expenses: 0,
        savings: 0,
        balance: 0,
      };
    }

    // Add to totals and categories
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
    } else if (t.type === "savings") {
      totalSavings += t.amount;
      savingsByCategory[t.category] =
        (savingsByCategory[t.category] || 0) + t.amount;
      monthlyMap[month].savings += t.amount;
    }
  });

  // Calculate monthly balances
  Object.values(monthlyMap).forEach((month) => {
    month.balance = month.income - month.expenses - month.savings;
  });

  // Sort months chronologically
  const monthlyData = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  // Find highest and lowest expense months
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

  // Top categories (all types combined)
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
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    balance:
      Math.round((totalIncome - totalExpenses - totalSavings) * 100) / 100,
    monthlyData,
    topCategories,
    highestMonth,
    lowestMonth,
    expensesByCategory,
    incomeByCategory,
    savingsByCategory,
  };
}
