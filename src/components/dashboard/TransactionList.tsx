import { useState, useMemo, useRef, useEffect } from "react";
import type { Transaction, Category } from "../../types";
import { deleteTransaction } from "../../lib/storage";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
  onEdit: (transaction: Transaction) => void;
  isSharedView?: boolean;
  persons?: { id: string; name: string }[];
  activePersonId?: string | null;
  onMakeShared?: (transactionId: string, paidBy: string) => void;
}

type SortField = "type" | "category" | "date" | "amount";
type SortDirection = "asc" | "desc";

interface SortIconProps {
  field: SortField;
  sortField: SortField | null;
  sortDirection: SortDirection;
}

function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field) return <span className="text-gray-300">⇅</span>;
  return sortDirection === "asc" ? (
    <span className="text-indigo-500">↑</span>
  ) : (
    <span className="text-indigo-500">↓</span>
  );
}

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
  isSharedView = false,
  persons = [],
  activePersonId = null,
  onMakeShared,
}: TransactionListProps) {
  const [filters, setFilters] = useState({
    expense: true,
    income: true,
    savings: true,
    shared: true,
    personal: true,
  });

  // null = all selected, empty Set = none selected, Set with values = specific selection
  const [selectedCategories, setSelectedCategories] =
    useState<Set<Category> | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Extract all unique categories from transactions
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer cette transaction ?")) {
      deleteTransaction(id);
      onDelete();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Toggle category selection
  const toggleCategory = (category: Category) => {
    // If null (all selected), create a set with all except the toggled one
    if (selectedCategories === null) {
      const newSelected = new Set(availableCategories);
      newSelected.delete(category);
      setSelectedCategories(newSelected);
      return;
    }

    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(null);
  };

  // Deselect all categories
  const deselectAllCategories = () => {
    setSelectedCategories(new Set());
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filter by type
      if (t.type === "expense" && !filters.expense) return false;
      if (t.type === "income" && !filters.income) return false;
      if (t.type === "savings" && !filters.savings) return false;

      // Filter by shared/personal
      if (t.isShared && !filters.shared) return false;
      if (!t.isShared && !filters.personal) return false;

      // Filter by category
      if (selectedCategories !== null) {
        // Empty set = none selected = filter all out
        if (selectedCategories.size === 0) return false;
        // Otherwise check if category is selected
        if (!selectedCategories.has(t.category)) return false;
      }
      // If null, all categories pass

      return true;
    });
  }, [transactions, filters, selectedCategories]);

  // Sort filtered transactions
  const sortedTransactions = useMemo(() => {
    if (!sortField) return filteredTransactions;

    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "date":
          comparison = a.date.localeCompare(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredTransactions, sortField, sortDirection]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 dark:text-gray-500 text-lg">
          Aucune transaction pour ce mois
        </p>
        <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">
          Cliquez sur le bouton + pour en ajouter une
        </p>
      </div>
    );
  }

  // Count selected categories for display
  const categoryButtonText =
    selectedCategories === null
      ? "Toutes les catégories"
      : selectedCategories.size === 0
        ? "Aucune catégorie"
        : selectedCategories.size === availableCategories.length
          ? "Toutes les catégories"
          : `${selectedCategories.size} catégorie${selectedCategories.size > 1 ? "s" : ""}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead>
          {/* Filters Row */}
          <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <td colSpan={6} className="px-4 py-3">
              <div className="flex items-center gap-6 flex-wrap">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Filtres :
                </span>

                {/* Type filters */}
                {!isSharedView && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.expense}
                        onChange={(e) =>
                          setFilters({ ...filters, expense: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Dépenses
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.income}
                        onChange={(e) =>
                          setFilters({ ...filters, income: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Revenus
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.savings}
                        onChange={(e) =>
                          setFilters({ ...filters, savings: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Épargne
                      </span>
                    </label>
                  </div>
                )}

                {/* Shared/Personal filters */}
                {!isSharedView && (
                  <div className="flex items-center gap-3 border-l border-gray-300 dark:border-gray-600 pl-6">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.shared}
                        onChange={(e) =>
                          setFilters({ ...filters, shared: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Commun
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.personal}
                        onChange={(e) =>
                          setFilters({ ...filters, personal: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Personnel
                      </span>
                    </label>
                  </div>
                )}

                {/* Category Dropdown */}
                {availableCategories.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="relative border-l border-gray-300 dark:border-gray-600 pl-6"
                  >
                    <button
                      onClick={() =>
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                      }
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                    >
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {categoryButtonText}
                      </span>
                      <span
                        className={`text-xs text-gray-400 transition-transform duration-200 ${
                          isCategoryDropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {/* Dropdown menu */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute z-30 top-full mt-1 left-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                        {/* Select all / Deselect all */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                          <button
                            onClick={selectAllCategories}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Tout sélectionner
                          </button>
                          <button
                            onClick={deselectAllCategories}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                          >
                            Tout désélectionner
                          </button>
                        </div>

                        {/* Category checkboxes */}
                        <div className="py-1">
                          {availableCategories.map((category) => (
                            <label
                              key={category}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedCategories === null ||
                                  selectedCategories.has(category)
                                }
                                onChange={() => toggleCategory(category)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {category}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Results count */}
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {sortedTransactions.length} résultat
                  {sortedTransactions.length !== 1 ? "s" : ""}
                </span>
              </div>
            </td>
          </tr>

          {/* Header Row */}
          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
            <th
              onClick={() => handleSort("type")}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
            >
              <div className="flex items-center gap-1">
                {isSharedView ? "Payé par" : "Type"}
                <SortIcon
                  field="type"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </th>
            <th
              onClick={() => handleSort("category")}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
            >
              <div className="flex items-center gap-1">
                Catégorie
                <SortIcon
                  field="category"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </th>
            <th
              onClick={() => handleSort("date")}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
            >
              <div className="flex items-center gap-1">
                Date
                <SortIcon
                  field="date"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Description
            </th>
            <th
              onClick={() => handleSort("amount")}
              className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
            >
              <div className="flex items-center justify-end gap-1">
                Montant
                <SortIcon
                  field="amount"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {sortedTransactions.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
              >
                Aucune transaction ne correspond aux filtres
              </td>
            </tr>
          ) : (
            sortedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onDelete={() => handleDelete(transaction.id)}
                onEdit={() => onEdit(transaction)}
                isSharedView={isSharedView}
                persons={persons}
                activePersonId={activePersonId}
                onMakeShared={onMakeShared}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: () => void;
  onEdit: () => void;
  isSharedView?: boolean;
  persons?: { id: string; name: string }[];
  activePersonId?: string | null;
  onMakeShared?: (transactionId: string, paidBy: string) => void;
}

function TransactionRow({
  transaction,
  onDelete,
  onEdit,
  isSharedView = false,
  persons = [],
  activePersonId = null,
  onMakeShared,
}: TransactionRowProps) {
  const isExpense = transaction.type === "expense";
  const isSavings = transaction.type === "savings";

  const formattedDate = new Date(
    transaction.date + "T00:00:00",
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const typeBadgeColor = isSavings
    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
    : isExpense
      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300"
      : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300";

  const typeLabel = isSavings ? "Épargne" : isExpense ? "Dépense" : "Revenu";

  // Find who paid
  const paidByPerson = persons.find((p) => p.id === transaction.paidBy);
  const paidByLabel = paidByPerson?.name || "—";

  const amountColor = isSavings
    ? "text-blue-600 dark:text-blue-400"
    : isExpense
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-400";

  const canMakeShared =
    !isSharedView &&
    !transaction.isShared &&
    activePersonId !== null &&
    transaction.personId === activePersonId;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-4 py-3">
        {isSharedView ? (
          // Show who paid in shared view
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {paidByLabel}
          </span>
        ) : (
          // Show type badge in individual view
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${typeBadgeColor}`}
          >
            {typeLabel}
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {transaction.category}
          </span>
          {transaction.isShared && (
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-1.5 py-0.5 rounded-full">
              Commune
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {formattedDate}
      </td>

      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {transaction.description || "—"}
      </td>

      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-bold ${amountColor}`}>
          {isSavings ? "" : isExpense ? "-" : "+"}
          {transaction.amount.toFixed(2)} €
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          {/* Show "Make Shared" button only in individual views for personal transactions */}
          {canMakeShared && onMakeShared && (
            <button
              onClick={() => onMakeShared(transaction.id, activePersonId)}
              className="px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title="Rendre commune"
            >
              👥 Commune
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            Éditer
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}
