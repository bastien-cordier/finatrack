import type { MonthlyResume } from "../../types";

interface SummaryCardsProps {
  summary: MonthlyResume;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balancePercentage = (() => {
    if (
      summary.totalIncome === 0 &&
      summary.totalExpenses === 0 &&
      summary.totalSavings === 0
    )
      return null;
    if (summary.totalIncome === 0) return null;

    if (summary.balance >= 0) {
      return Math.round((summary.balance / summary.totalIncome) * 1000) / 10;
    } else {
      return (
        Math.round((Math.abs(summary.balance) / summary.totalIncome) * 1000) /
        10
      );
    }
  })();

  const balanceLabel = summary.balance >= 0 ? "Excédent" : "Déficit";

  const cards = [
    {
      label: "Revenus",
      value: summary.totalIncome,
      color: "green",
      icon: "↑",
      percentage: null as number | null,
      percentageLabel: null as string | null,
    },
    {
      label: "Dépenses",
      value: summary.totalExpenses,
      color: "red",
      icon: "↓",
      percentage: null as number | null,
      percentageLabel: null as string | null,
    },
    {
      label: "Épargne",
      value: summary.totalSavings,
      color: "blue" as const,
      icon: "💰",
      percentage: null as number | null,
      percentageLabel: null as string | null,
    },
    {
      label: "Solde",
      value: summary.balance,
      color: summary.balance >= 0 ? "green" : "red",
      icon: summary.balance >= 0 ? "✓" : "!",
      percentage: balancePercentage,
      percentageLabel: balanceLabel,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
        >
          {/* Icon + label */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm
                ${card.color === "green" ? "bg-green-500" : "bg-red-500"}`}
            >
              {card.icon}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </span>
          </div>

          {/* Amount */}
          <p
            className={`text-lg font-bold
              ${
                card.label === "Solde"
                  ? card.color === "green"
                    ? "text-green-500"
                    : "text-red-500"
                  : card.label === "Épargne"
                    ? "text-blue-500"
                    : "text-gray-900 dark:text-white"
              }`}
          >
            {card.value.toFixed(2)} €
          </p>

          {/* Percentage badge */}
          {card.percentage !== null && card.percentageLabel !== null && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full
                  ${
                    card.color === "green"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
              >
                {card.color === "red" && "-"}
                {card.percentage}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {card.percentageLabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
