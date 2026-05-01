export type ExpenseCategory =
  | "Courses"
  | "Restaurants / Fast-food"
  | "Cantine"
  | "Voiture"
  | "Logement"
  | "Santé"
  | "Assurances"
  | "Sport"
  | "Divertissement"
  | "Shopping"
  | "Abonnements"
  | "Vacances"
  | "Utilitaires"
  | "Autres";

export type IncomeCategory =
  | "Salaire"
  | "Cadeaux"
  | "Remboursements maladie"
  | "Remboursements classique"
  | "Autres";

export type SavingsCategory = "Épargne";

export type Category = ExpenseCategory | IncomeCategory | SavingsCategory;

export type TransactionType = "expense" | "income" | "savings";

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: Category;
  type: TransactionType;
  description: string;
  isShared: boolean;
  personId: string | null;
  paidBy: string | null;
}

export interface Person {
  id: string;
  name: string;
}

export interface AppConfig {
  persons: Person[];
  activeMonth: string;
}

export interface MonthlyResume {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  balance: number;
  expensesByCategory: Record<string, number>;
  expensePercentages: Record<string, number>;
  incomeByCategory: Record<string, number>;
  incomePercentages: Record<string, number>;
  savingsByCategory: Record<string, number>;
  savingsPercentages: Record<string, number>;
}
