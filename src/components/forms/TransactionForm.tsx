import { useState, useEffect } from "react";
import type {
  Transaction,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  Category,
} from "../../types";
import { addTransaction, updateTransaction } from "../../lib/storage";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Courses",
  "Restaurants / Fast-food",
  "Cantine",
  "Voiture",
  "Logement",
  "Santé",
  "Divertissement",
  "Shopping",
  "Abonnements",
  "Vacances",
  "Utilitaires",
  "Autres",
];

const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salaire",
  "Cadeaux",
  "Remboursements maladie",
  "Remboursements classique",
  "Autres",
];

interface TransactionFormProps {
  persons: { id: string; name: string }[];
  onSubmit: () => void;
  onShowToast: (message: string) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export function TransactionForm({
  persons,
  onSubmit,
  onShowToast,
  editingTransaction = null,
  onCancelEdit,
}: TransactionFormProps) {
  // Initialize state from editingTransaction if present, otherwise use defaults
  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editingTransaction ? String(editingTransaction.amount) : "",
  );
  const [date, setDate] = useState(
    editingTransaction?.date ?? new Date().toISOString().split("T")[0],
  );
  const [category, setCategory] = useState<Category | "">(
    editingTransaction?.category ??
      (editingTransaction?.type === "savings" ? "Épargne" : ""),
  );
  const [description, setDescription] = useState(
    editingTransaction?.description ?? "",
  );
  const [isShared, setIsShared] = useState(
    editingTransaction?.isShared ?? false,
  );
  const [personId, setPersonId] = useState<string | null>(
    editingTransaction?.personId ?? persons[0]?.id ?? null,
  );
  const [paidBy, setPaidBy] = useState<string | null>(
    editingTransaction?.paidBy ?? persons[0]?.id ?? null,
  );

  // When editingTransaction changes, populate the form
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setIsShared(editingTransaction.isShared);
      setPersonId(editingTransaction.personId);
      setPaidBy(editingTransaction.paidBy);
    }
  }, [editingTransaction]);

  const categories =
    type === "expense"
      ? EXPENSE_CATEGORIES
      : type === "income"
        ? INCOME_CATEGORIES
        : ["Épargne"];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Auto-select category when switching to savings
    if (newType === "savings") {
      setCategory("Épargne");
    } else {
      setCategory("");
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
  };

  const resetFormFull = () => {
    setType("expense");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("");
    setDescription("");
    setIsShared(false);
    setPersonId(persons[0]?.id ?? null);
    setPaidBy(persons[0]?.id ?? null);
  };

  const handleSubmit = () => {
    if (!amount || !category || !date) return;

    const transaction: Transaction = {
      id: editingTransaction?.id ?? `txn_${Date.now()}`,
      amount: parseFloat(amount),
      date,
      category,
      type,
      description,
      isShared,
      personId: isShared ? null : personId,
      paidBy: isShared ? paidBy : null, // Only track paidBy for shared expenses
    };

    if (editingTransaction) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }

    onSubmit();
    onShowToast(
      editingTransaction
        ? "Transaction modifiée !"
        : `${type === "expense" ? "Dépense" : type === "income" ? "Revenu" : "Épargne"} ajouté !`,
    );

    if (editingTransaction && onCancelEdit) {
      onCancelEdit();
    }

    resetForm();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Edit mode indicator */}
      {editingTransaction && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
            ✏️ Modification en cours
          </span>
          {onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {/* Toggle: Dépense / Revenu / Épargne */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
        <button
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors
            ${
              type === "expense"
                ? "bg-red-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
        >
          Dépense
        </button>
        <button
          onClick={() => handleTypeChange("income")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors
            ${
              type === "income"
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
        >
          Revenu
        </button>
        <button
          onClick={() => handleTypeChange("savings")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors
            ${
              type === "savings"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
        >
          Épargne
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Montant (€)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category - hidden if savings */}
      {type !== "savings" && (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Description (optionnel)
        </label>
        <input
          type="text"
          placeholder="Ex: Livret A"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Shared toggle */}
      {persons.length === 2 && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {type === "savings"
              ? "Épargne commune ?"
              : type === "expense"
                ? "Dépense commune ?"
                : "Revenu commun ?"}
          </span>
          <button
            onClick={() => setIsShared(!isShared)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300
              ${isShared ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isShared ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      )}

      {/* NEW: "Paid by" selector - only if shared and 2 persons */}
      {persons.length === 2 && isShared && (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Payé par
          </label>
          <div className="flex gap-2">
            {persons.map((person) => (
              <button
                key={person.id}
                onClick={() => setPaidBy(person.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${
                    paidBy === person.id
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
              >
                {person.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Person selector - only if NOT shared and 2 persons */}
      {persons.length === 2 && !isShared && (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Personne
          </label>
          <div className="flex gap-2">
            {persons.map((person) => (
              <button
                key={person.id}
                onClick={() => setPersonId(person.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${
                    personId === person.id
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
              >
                {person.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={resetFormFull}
          className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleSubmit}
          disabled={!amount || !category || !date}
          className="flex-1 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold transition-colors"
        >
          {editingTransaction ? "Modifier" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}
