import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "../ui/button";
import { LineChartIcon, BarChart3 } from "lucide-react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { Card } from "../ui/card";
import { StatCard } from "../ui/StatCard";
import type { Transaction } from "../../types";
import { calculateAnnualSummary } from "../../lib/calculations/annual";
import {
  formatMonthShort,
  formatCurrency,
  calculateChange,
} from "../../lib/helpers";
import { useDarkModeDetection } from "../../hooks/useDarkModeDetection";

interface AnnualViewProps {
  transactions: Transaction[];
  year: string;
}

export function AnnualView({ transactions, year }: AnnualViewProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const isDarkMode = useDarkModeDetection();

  const summary = useMemo(
    () => calculateAnnualSummary(transactions, year),
    [transactions, year],
  );

  const previousYear = (parseInt(year) - 1).toString();
  const previousYearTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(previousYear)),
    [transactions, previousYear],
  );

  const previousYearSummary = useMemo(
    () => calculateAnnualSummary(previousYearTransactions, previousYear),
    [previousYearTransactions, previousYear],
  );

  const incomeChange = calculateChange(
    summary.totalIncome,
    previousYearSummary.totalIncome,
  );
  const expensesChange = calculateChange(
    summary.totalExpenses,
    previousYearSummary.totalExpenses,
  );
  const savingsChange = calculateChange(
    summary.totalSavings,
    previousYearSummary.totalSavings,
  );
  const balanceChange = calculateChange(
    summary.balance,
    previousYearSummary.balance,
  );

  const chartData = useMemo(() => {
    const allMonths = [];
    for (let i = 0; i < 12; i++) {
      const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`;
      const monthData = summary.monthlyData.find((m) => m.month === monthStr);

      allMonths.push({
        month: formatMonthShort(monthStr),
        Revenus: monthData?.income || 0,
        Dépenses: monthData?.expenses || 0,
        Épargne: monthData?.savings || 0,
      });
    }
    return allMonths;
  }, [summary.monthlyData, year]);

  const axisStyle = {
    tick: {
      fill: isDarkMode ? "#a3a3a3" : "#737373",
      fontSize: 12,
    },
    tickLine: {
      stroke: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#e5e5e5",
    },
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      border: isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid #e5e5e5",
      borderRadius: "0.5rem",
      color: isDarkMode ? "#fafafa" : "#171717",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    labelStyle: {
      color: isDarkMode ? "#fafafa" : "#171717",
      marginBottom: "8px",
      fontWeight: 600,
    },
  };

  const summaryCards = [
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
      iconColor:
        summary.balance >= 0 ? "text-emerald-500" : "text-rose-500",
      bgColor:
        summary.balance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      valueColorClass:
        summary.balance >= 0
          ? "text-emerald-600 dark:text-emerald-600"
          : "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            {...card}
            showChange={true}
            comparisonLabel="vs année précédente"
          />
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">📈 Évolution mensuelle</h3>
          <div className="flex gap-2">
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
              className="gap-2"
            >
              <LineChartIcon className="h-4 w-4" />
              Courbes
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Barres
            </Button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          {chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip
                formatter={(value: number | undefined) =>
                  value !== undefined ? `${formatCurrency(value)} €` : "0.00 €"
                }
                {...tooltipStyle}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
                iconSize={10}
              />
              <Line
                type="monotone"
                dataKey="Revenus"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="Dépenses"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="Épargne"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData} barGap={8}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip
                formatter={(value: number | undefined) =>
                  value !== undefined ? `${formatCurrency(value)} €` : "0.00 €"
                }
                {...tooltipStyle}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
                iconSize={10}
              />
              <Bar dataKey="Revenus" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Épargne" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">
          📊 Dépenses par catégorie et par mois
        </h3>
        {Object.keys(summary.expensesByCategoryByMonth).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-5xl mb-3">📊</span>
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Catégorie
                  </th>
                  {chartData.map((m) => (
                    <th
                      key={m.month}
                      className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground"
                    >
                      {m.month}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, total]) => (
                    <tr
                      key={category}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{category}</td>
                      {chartData.map((m, i) => {
                        const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
                        const amount =
                          summary.expensesByCategoryByMonth[monthKey]?.[
                            category
                          ] || 0;
                        return (
                          <td
                            key={m.month}
                            className="text-right py-3 px-4 text-sm text-muted-foreground"
                          >
                            {amount > 0 ? `${formatCurrency(amount)} €` : "—"}
                          </td>
                        );
                      })}
                      <td className="text-right py-3 px-4 font-semibold">
                        {formatCurrency(total)} €
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
