import type { Transaction, AppConfig, Person } from "../../types";

const STORAGE_KEYS = {
  TRANSACTIONS: "comptability_transactions",
  CONFIG: "comptability_config",
  ACTIVE_PERSON: "comptability_active_person",
  WELCOMED: "comptability_welcomed",
} as const;

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function load<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getTransactions(): Transaction[] {
  return load<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) ?? [];
}

export function saveTransactions(transactions: Transaction[]): void {
  save(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function addTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
}

export function updateTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === transaction.id);
  if (index !== -1) {
    transactions[index] = transaction;
    saveTransactions(transactions);
  }
}

export function deleteTransaction(id: string): void {
  const transactions = getTransactions().filter((t) => t.id !== id);
  saveTransactions(transactions);
}

// Import transactions from a backup
export function importTransactions(
  newTransactions: Transaction[],
  month: string,
  replaceAll: boolean = false,
): void {
  let allTransactions = getTransactions();

  if (replaceAll) {
    // Replace all transactions for this month
    allTransactions = allTransactions.filter((t) => !t.date.startsWith(month));
  }

  // Add new transactions (avoid duplicates by ID)
  const existingIds = new Set(allTransactions.map((t) => t.id));
  const transactionsToAdd = newTransactions.filter(
    (t) => !existingIds.has(t.id),
  );

  allTransactions.push(...transactionsToAdd);
  saveTransactions(allTransactions);
}

const DEFAULT_CONFIG: AppConfig = {
  persons: [{ id: "person_1", name: "Vous" }],
  activeMonth: new Date().toISOString().slice(0, 7),
};

export function getConfig(): AppConfig {
  return load<AppConfig>(STORAGE_KEYS.CONFIG) ?? DEFAULT_CONFIG;
}

export function saveConfig(config: AppConfig): void {
  save(STORAGE_KEYS.CONFIG, config);
}

export function savePersons(persons: Person[]): void {
  const config = getConfig();
  saveConfig({ ...config, persons });
}

export function getActivePerson(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PERSON);
}

export function saveActivePerson(personId: string | null): void {
  if (personId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PERSON, personId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PERSON);
  }
}

export function isFirstVisit(): boolean {
  return !localStorage.getItem(STORAGE_KEYS.WELCOMED);
}

export function markWelcomed(): void {
  localStorage.setItem(STORAGE_KEYS.WELCOMED, "true");
}
