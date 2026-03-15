import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface PieChartData {
  name: string;
  value: number;
}

interface ExpensePieChartProps {
  data: Record<string, number>;
  title: string;
  color?: string;
}

export function ExpensePieChart({ data, title }: ExpensePieChartProps) {
  const chartData: PieChartData[] = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h3>
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
          Pas de données
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50} // donut style
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              <span>
                <strong>{name}</strong>
                <br />
                {value.toFixed(2)} €
              </span>,
            ]}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
