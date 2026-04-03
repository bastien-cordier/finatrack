import {
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { calculateChange } from "../../lib/helpers";
import type { MonthlyResume } from "../../types";

interface SummaryCardsProps {
  summary: MonthlyResume;
  previousSummary?: MonthlyResume;
}

export function SummaryCards({ summary, previousSummary }: SummaryCardsProps) {
  const incomeChange = previousSummary
    ? calculateChange(summary.totalIncome, previousSummary.totalIncome)
    : 0;
  const expensesChange = previousSummary
    ? calculateChange(summary.totalExpenses, previousSummary.totalExpenses)
    : 0;
  const savingsChange = previousSummary
    ? calculateChange(summary.totalSavings, previousSummary.totalSavings)
    : 0;
  const balanceChange = previousSummary
    ? calculateChange(summary.balance, previousSummary.balance)
    : 0;

  const cards = [
    {
      label: "Revenus",
      value: summary.totalIncome,
      change: incomeChange,
      icon: ArrowUpCircle,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Dépenses",
      value: summary.totalExpenses,
      change: expensesChange,
      icon: ArrowDownCircle,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      label: "Épargne",
      value: summary.totalSavings,
      change: savingsChange,
      icon: PiggyBank,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Solde",
      value: summary.balance,
      change: balanceChange,
      icon: Wallet,
      iconColor: summary.balance >= 0 ? "text-emerald-500" : "text-rose-500",
      bgColor: summary.balance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          {...card}
          showChange={!!previousSummary}
          comparisonLabel="vs mois précédent"
        />
      ))}
    </div>
  );
}
