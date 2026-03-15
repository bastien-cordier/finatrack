import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Transaction } from "../../types";
import { calculateAnnualSummary } from "../../lib/calculations/annual";

interface AnnualViewProps {
  transactions: Transaction[];
  year: string;
  personName?: string;
}

export function AnnualView({
  transactions,
  year,
  personName,
}: AnnualViewProps) {
  const summary = useMemo(
    () => calculateAnnualSummary(transactions, year),
    [transactions, year],
  );

  const formatMonth = (month: string) => {
    return new Date(month + "-01").toLocaleDateString("fr-FR", {
      month: "short",
    });
  };

  const chartData = summary.monthlyData.map((m) => ({
    month: formatMonth(m.month),
    Revenus: m.income,
    Dépenses: m.expenses,
    Épargne: m.savings,
  }));

  return (
    <div className="space-y-6">
      {/* Person indicator */}
      {personName && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-3">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            📊 Statistiques annuelles de{" "}
            <span className="font-semibold">{personName}</span>
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-lg">
              ↑
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Revenus
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.totalIncome.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-lg">
              ↓
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Dépenses
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.totalExpenses.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg">
              💰
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Épargne
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalSavings.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                summary.balance >= 0
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              } text-lg`}
            >
              {summary.balance >= 0 ? "✓" : "!"}
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Solde
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              summary.balance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {summary.balance.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          📈 Évolution mensuelle
        </h3>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-6xl mb-4">📊</span>
            <p className="text-gray-400 dark:text-gray-500 text-center">
              Aucune transaction pour cette année
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.1}
              />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                style={{ fontSize: "13px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "13px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "#d1d5db", marginBottom: "8px" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="Revenus"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: "#10b981" }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Dépenses"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 5, fill: "#ef4444" }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Épargne"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3b82f6" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🏆 Top 5 catégories
          </h3>
          {summary.topCategories.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">
              Aucune donnée
            </p>
          ) : (
            <div className="space-y-3">
              {summary.topCategories.slice(0, 5).map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {cat.category}
                      </p>
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                          cat.type === "expense"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300"
                            : cat.type === "income"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                        }`}
                      >
                        {cat.type === "expense"
                          ? "Dépense"
                          : cat.type === "income"
                            ? "Revenu"
                            : "Épargne"}
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {cat.amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Month comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📊 Comparaison mensuelle
          </h3>
          {summary.monthlyData.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">
              Aucune donnée
            </p>
          ) : (
            <div className="space-y-4">
              {/* Highest */}
              <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔥</span>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Mois le plus dépensier
                  </p>
                </div>
                <p className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                  {new Date(
                    summary.highestMonth.month + "-01",
                  ).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {summary.highestMonth.amount.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>
              </div>

              {/* Lowest */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🌱</span>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                    Mois le plus économe
                  </p>
                </div>
                <p className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">
                  {new Date(
                    summary.lowestMonth.month + "-01",
                  ).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {summary.lowestMonth.amount.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
