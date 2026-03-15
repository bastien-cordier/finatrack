import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Person } from "../../types";

// Color palette for the pie slices
const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#e11d48",
];

interface SharedExpensesViewProps {
  persons: Person[];
  sharedTotal: number;
  sharedByCategory: Record<string, number>;
  paidByPerson: Record<string, number>;
  shouldPay: Record<string, number>;
  balance: Record<string, number>;
}

// Custom tooltip component avec typage correct
interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    percentage?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-800 px-4 py-3 rounded-xl shadow-lg border border-gray-700">
        <p className="text-white font-semibold text-sm mb-1">
          {payload[0].name}
        </p>
        <p className="text-indigo-300 font-bold text-base">
          {payload[0].value.toFixed(2)} €
        </p>
        {payload[0].payload.percentage !== undefined && (
          <p className="text-gray-400 text-xs mt-1">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function SharedExpensesView({
  persons,
  sharedTotal,
  sharedByCategory,
  paidByPerson,
}: SharedExpensesViewProps) {
  // User-defined split percentages (default 50/50)
  // IMPORTANT: useState doit être appelé AVANT tout return conditionnel
  const [splitPercentages, setSplitPercentages] = useState(() => {
    if (persons.length >= 2) {
      return {
        [persons[0].id]: 50,
        [persons[1].id]: 50,
      };
    }
    return {};
  });

  // Maintenant on peut faire le return conditionnel
  if (persons.length < 2) return null;

  // Update percentage and auto-adjust the other
  const handlePercentageChange = (personId: string, value: number) => {
    const capped = Math.max(0, Math.min(100, value));
    const otherId = persons.find((p) => p.id !== personId)?.id;
    if (!otherId) return;

    setSplitPercentages({
      [personId]: capped,
      [otherId]: 100 - capped,
    });
  };

  // Recalculate based on current percentages
  const recalculatedShouldPay = {
    [persons[0].id]: (sharedTotal * splitPercentages[persons[0].id]) / 100,
    [persons[1].id]: (sharedTotal * splitPercentages[persons[1].id]) / 100,
  };

  const recalculatedBalance = {
    [persons[0].id]:
      (paidByPerson[persons[0].id] || 0) - recalculatedShouldPay[persons[0].id],
    [persons[1].id]:
      (paidByPerson[persons[1].id] || 0) - recalculatedShouldPay[persons[1].id],
  };

  // Who owes whom
  const person1Balance = recalculatedBalance[persons[0].id];

  const owes =
    Math.abs(person1Balance) < 0.01
      ? null
      : person1Balance > 0
        ? {
            from: persons[1].name,
            to: persons[0].name,
            amount: Math.abs(person1Balance),
          }
        : {
            from: persons[0].name,
            to: persons[1].name,
            amount: Math.abs(person1Balance),
          };

  // Prepare data for category pie chart
  const categoryData = Object.entries(sharedByCategory)
    .map(([name, value]) => ({
      name,
      value,
      percentage: sharedTotal > 0 ? (value / sharedTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare data for "who paid" pie chart
  const paidByData = persons.map((person) => ({
    name: person.name,
    value: paidByPerson[person.id] || 0,
    percentage:
      sharedTotal > 0
        ? ((paidByPerson[person.id] || 0) / sharedTotal) * 100
        : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Title + Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Dépenses communes
        </h2>
        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          {sharedTotal.toFixed(2)} €
        </p>
      </div>

      {/* Two pie charts in a row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pie 1: By Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Par catégorie
          </h3>
          {categoryData.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
              Aucune dépense
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie 2: Who Paid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Qui a payé ?
          </h3>
          {sharedTotal === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
              Aucune dépense
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paidByData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Adjustable split percentages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Ajuster la répartition
        </h3>

        <div className="space-y-4">
          {persons.map((person) => (
            <div key={person.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {person.name}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPercentages[person.id]}
                    onChange={(e) =>
                      handlePercentageChange(
                        person.id,
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-16 px-2 py-1 text-sm text-right rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    % = {recalculatedShouldPay[person.id].toFixed(2)} €
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${splitPercentages[person.id]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who owes whom */}
      {owes && sharedTotal > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
            💰 Remboursement
          </h3>
          <p className="text-lg text-amber-900 dark:text-amber-200">
            <span className="font-semibold">{owes.from}</span> doit{" "}
            <span className="font-bold text-2xl">
              {owes.amount.toFixed(2)} €
            </span>{" "}
            à <span className="font-semibold">{owes.to}</span>
          </p>
        </div>
      )}
    </div>
  );
}
