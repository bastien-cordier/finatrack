import { useState } from "react";
import type {
  Transaction,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  Category,
} from "../../types";
import { addTransaction, updateTransaction } from "../../lib/storage";
import { generateId } from "../../lib/helpers";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Card } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Courses",
  "Restaurants / Fast-food",
  "Cantine",
  "Voiture",
  "Logement",
  "Santé",
  "Assurances",
  "Sport",
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
  activePersonId?: string | null;
}

export function TransactionForm({
  persons,
  onSubmit,
  onShowToast,
  editingTransaction = null,
  onCancelEdit,
  activePersonId = null,
}: TransactionFormProps) {
  // Determine initial person based on context
  const getInitialPersonId = () => {
    if (editingTransaction?.personId) return editingTransaction.personId;
    if (activePersonId) return activePersonId;
    return persons[0]?.id ?? null;
  };

  const getInitialPaidBy = () => {
    if (editingTransaction?.paidBy) return editingTransaction.paidBy;
    if (activePersonId) return activePersonId;
    return persons[0]?.id ?? null;
  };

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
  const [personId, setPersonId] = useState<string | null>(getInitialPersonId);
  const [paidBy, setPaidBy] = useState<string | null>(getInitialPaidBy);

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

    const parsedAmount = parseFloat(amount);
    if (!isFinite(parsedAmount) || parsedAmount <= 0) return;

    const transaction: Transaction = {
      id: editingTransaction?.id ?? generateId("txn"),
      amount: parsedAmount,
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

  const activePerson = persons.find((p) => p.id === activePersonId);

  return (
    <div className="space-y-6">
      {/* Edit mode indicator */}
      {editingTransaction && (
        <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
              ✏️ Modification en cours
            </span>
            {onCancelEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="h-auto py-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600"
              >
                Annuler
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Active person indicator - only for new transactions */}
      {!editingTransaction && activePerson && persons.length === 2 && (
        <Card className="bg-muted/50 border-muted p-3">
          <p className="text-sm text-muted-foreground">
            Transaction attribuée à{" "}
            <span className="font-semibold text-foreground">
              {activePerson.name}
            </span>
          </p>
        </Card>
      )}

      {/* Type selector */}
      <div className="space-y-2">
        <Label>Type de transaction</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={type === "expense" ? "default" : "outline"}
            onClick={() => handleTypeChange("expense")}
            className={
              type === "expense"
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : ""
            }
          >
            Dépense
          </Button>
          <Button
            type="button"
            variant={type === "income" ? "default" : "outline"}
            onClick={() => handleTypeChange("income")}
            className={
              type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : ""
            }
          >
            Revenu
          </Button>
          <Button
            type="button"
            variant={type === "savings" ? "default" : "outline"}
            onClick={() => handleTypeChange("savings")}
            className={
              type === "savings"
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : ""
            }
          >
            Épargne
          </Button>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€)</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Category - hidden if savings */}
      {type !== "savings" && (
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as Category)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Input
          id="description"
          type="text"
          placeholder="Ex: Livret A"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Shared toggle */}
      {persons.length === 2 && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shared-toggle" className="text-base">
                {type === "savings"
                  ? "Épargne commune"
                  : type === "expense"
                    ? "Dépense commune"
                    : "Revenu commun"}
              </Label>
              <p className="text-xs text-muted-foreground">
                Partagée entre {persons[0].name} et {persons[1].name}
              </p>
            </div>
            <Switch
              id="shared-toggle"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
          </div>
        </Card>
      )}

      {/* "Paid by" selector - only if shared and 2 persons */}
      {persons.length === 2 && isShared && (
        <div className="space-y-2">
          <Label>Payé par</Label>
          <div className="grid grid-cols-2 gap-2">
            {persons.map((person) => (
              <Button
                key={person.id}
                type="button"
                variant={paidBy === person.id ? "default" : "outline"}
                onClick={() => setPaidBy(person.id)}
              >
                {person.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={resetFormFull}
          className="flex-1"
        >
          Réinitialiser
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!amount || !category || !date}
          className="flex-1"
        >
          {editingTransaction ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}
