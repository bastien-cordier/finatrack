import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { ArrowUpDown, Pencil, Trash2, Users, ChevronDown } from "lucide-react";
import type { Transaction, TransactionType } from "../../types";
import { deleteTransaction } from "../../lib/storage";
import { formatDate } from "../../lib/helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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

interface FilterState {
  types: Set<TransactionType>;
  categories: Set<string>;
}

const SortButton = ({
  field,
  children,
  onClick,
}: {
  field: SortField;
  children: React.ReactNode;
  onClick: (field: SortField) => void;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onClick(field)}
    className="-ml-3 h-8 data-[state=open]:bg-accent"
  >
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
  isSharedView = false,
  persons = [],
  activePersonId = null,
  onMakeShared,
}: TransactionListProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const allCategories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category))).sort();
  }, [transactions]);

  const [filters, setFilters] = useState<FilterState>({
    types: new Set<TransactionType>(["expense", "income", "savings"]),
    categories: new Set<string>(),
  });

  const effectiveCategoriesFilter = useMemo(() => {
    return filters.categories.size === 0
      ? new Set(allCategories)
      : filters.categories;
  }, [filters.categories, allCategories]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleTypeFilter = (type: TransactionType) => {
    setFilters((prev) => {
      const newTypes = new Set(prev.types);
      if (newTypes.has(type)) newTypes.delete(type);
      else newTypes.add(type);
      return { ...prev, types: newTypes };
    });
  };

  const toggleCategoryFilter = (category: string) => {
    setFilters((prev) => {
      const newCategories = new Set(prev.categories);
      if (newCategories.has(category)) newCategories.delete(category);
      else newCategories.add(category);
      return { ...prev, categories: newCategories };
    });
  };

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter(
      (t) =>
        filters.types.has(t.type) && effectiveCategoriesFilter.has(t.category),
    );

    return [...filtered].sort((a, b) => {
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
  }, [
    transactions,
    filters,
    effectiveCategoriesFilter,
    sortField,
    sortDirection,
  ]);

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
      deleteTransaction(id);
      onDelete();
    }
  };

  const handleMakeShared = (transaction: Transaction) => {
    if (!onMakeShared || !activePersonId) return;
    onMakeShared(transaction.id, activePersonId);
  };

  if (filteredAndSortedTransactions.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Commencez par ajouter votre première transaction
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Barre de filtres — scrollable sur mobile */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 overflow-x-auto">
        <span className="text-sm font-semibold text-muted-foreground shrink-0 hidden sm:inline">
          Filtres :
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              Type
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.types.has("expense")}
              onCheckedChange={() => toggleTypeFilter("expense")}
            >
              Dépenses
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types.has("income")}
              onCheckedChange={() => toggleTypeFilter("income")}
            >
              Revenus
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.types.has("savings")}
              onCheckedChange={() => toggleTypeFilter("savings")}
            >
              Épargne
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              Catégorie
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Filtrer par catégorie</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allCategories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={
                  filters.categories.size === 0 ||
                  filters.categories.has(category)
                }
                onCheckedChange={() => toggleCategoryFilter(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="ml-auto text-sm text-muted-foreground shrink-0">
          {filteredAndSortedTransactions.length} transaction
          {filteredAndSortedTransactions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table avec scroll horizontal sur mobile */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[110px]">
                <SortButton field="type" onClick={handleSort}>
                  {isSharedView ? "Payé par" : "Type"}
                </SortButton>
              </TableHead>
              <TableHead className="min-w-[130px] hidden sm:table-cell">
                <SortButton field="category" onClick={handleSort}>
                  Catégorie
                </SortButton>
              </TableHead>
              <TableHead className="min-w-[110px] hidden md:table-cell">
                <SortButton field="date" onClick={handleSort}>
                  Date
                </SortButton>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead className="text-right min-w-[100px]">
                <SortButton field="amount" onClick={handleSort}>
                  Montant
                </SortButton>
              </TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.map((transaction) => {
              const isExpense = transaction.type === "expense";
              const isIncome = transaction.type === "income";
              const isSavings = transaction.type === "savings";
              const paidByPerson = persons.find(
                (p) => p.id === transaction.paidBy,
              );
              const canMakeShared =
                !isSharedView &&
                !transaction.isShared &&
                activePersonId !== null &&
                transaction.personId === activePersonId;

              return (
                <TableRow key={transaction.id} className="group">
                  {/* Type / Payé par */}
                  <TableCell>
                    {isSharedView ? (
                      <span className="font-medium text-sm">
                        {paidByPerson?.name || "—"}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            isExpense
                              ? "destructive"
                              : isIncome
                                ? "default"
                                : "secondary"
                          }
                          className={
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              : isSavings
                                ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                : ""
                          }
                        >
                          {isSavings ? "Épargne" : isExpense ? "Dépense" : "Revenu"}
                        </Badge>
                        {transaction.isShared && (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            <span className="hidden sm:inline">Commune</span>
                          </Badge>
                        )}
                        {/* Catégorie inline sur mobile */}
                        <span className="text-xs text-muted-foreground sm:hidden block w-full mt-0.5">
                          {transaction.category}
                          {transaction.date && (
                            <> · {formatDate(transaction.date)}</>
                          )}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  {/* Catégorie — masquée sur xs */}
                  <TableCell className="font-medium hidden sm:table-cell">
                    {transaction.category}
                  </TableCell>

                  {/* Date — masquée sur xs et sm */}
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {formatDate(transaction.date)}
                  </TableCell>

                  {/* Description — masquée sous lg */}
                  <TableCell className="max-w-[200px] truncate text-muted-foreground hidden lg:table-cell">
                    {transaction.description || "—"}
                  </TableCell>

                  {/* Montant */}
                  <TableCell className="text-right font-semibold">
                    <span
                      className={
                        isExpense
                          ? "text-rose-600 dark:text-rose-400"
                          : isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-blue-600 dark:text-blue-400"
                      }
                    >
                      {transaction.amount.toFixed(2)} €
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-1.5">
                        {canMakeShared && onMakeShared && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/20"
                                onClick={() => handleMakeShared(transaction)}
                              >
                                <Users className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rendre commune</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-800"
                              onClick={() => onEdit(transaction)}
                            >
                              <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-rose-200 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
