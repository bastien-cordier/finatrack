import type { Transaction, MonthlyResume } from "../../types";

export function calculateMonthlySummary(
  transactions: Transaction[],
): MonthlyResume {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  const expensesByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const savingsByCategory: Record<string, number> = {};

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

  // Calculate percentages
  const expensePercentages: Record<string, number> = {};
  Object.keys(expensesByCategory).forEach((cat) => {
    expensePercentages[cat] =
      totalExpenses > 0
        ? Math.round((expensesByCategory[cat] / totalExpenses) * 1000) / 10
        : 0;
  });

  const incomePercentages: Record<string, number> = {};
  Object.keys(incomeByCategory).forEach((cat) => {
    incomePercentages[cat] =
      totalIncome > 0
        ? Math.round((incomeByCategory[cat] / totalIncome) * 1000) / 10
        : 0;
  });

  const savingsPercentages: Record<string, number> = {};
  Object.keys(savingsByCategory).forEach((cat) => {
    savingsPercentages[cat] =
      totalSavings > 0
        ? Math.round((savingsByCategory[cat] / totalSavings) * 1000) / 10
        : 0;
  });

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    balance:
      Math.round((totalIncome - totalExpenses - totalSavings) * 100) / 100,
    expensesByCategory,
    expensePercentages,
    incomeByCategory,
    incomePercentages,
    savingsByCategory,
    savingsPercentages,
  };
}

// -----------------------------------------------------------
// Calculate shared expenses split between 2 persons
// Returns breakdown of shared expenses only
// -----------------------------------------------------------
export function calculateSharedSplit(
  transactions: Transaction[],
  splitPercentages: Record<string, number>, // { person1Id: 50, person2Id: 50 }
) {
  let sharedTotal = 0;
  const sharedByCategory: Record<string, number> = {};
  const paidByPerson: Record<string, number> = {}; // Who paid what

  transactions.forEach((t) => {
    // Only count shared expenses
    if (t.type === "expense" && t.isShared) {
      sharedTotal += t.amount;

      // By category
      sharedByCategory[t.category] =
        (sharedByCategory[t.category] || 0) + t.amount;

      // Track who paid
      if (t.paidBy) {
        paidByPerson[t.paidBy] = (paidByPerson[t.paidBy] || 0) + t.amount;
      }
    }
  });

  // Calculate what each person should pay based on percentages
  const shouldPay: Record<string, number> = {};
  Object.keys(splitPercentages).forEach((personId) => {
    shouldPay[personId] = (sharedTotal * splitPercentages[personId]) / 100;
  });

  // Calculate who owes whom
  const balance: Record<string, number> = {};
  Object.keys(shouldPay).forEach((personId) => {
    const paid = paidByPerson[personId] || 0;
    const owes = shouldPay[personId];
    balance[personId] = paid - owes; // positive = should receive, negative = should pay
  });

  return {
    sharedTotal: Math.round(sharedTotal * 100) / 100,
    sharedByCategory,
    paidByPerson,
    shouldPay,
    balance,
  };
}
