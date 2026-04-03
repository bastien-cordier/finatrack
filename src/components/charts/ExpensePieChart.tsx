import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS } from "../../lib/helpers";

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
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-5xl mb-3">📊</span>
          <p className="text-sm text-muted-foreground">Pas de données</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(
              value: number | undefined,
              name: string | undefined,
            ) => [
              <span key={name}>
                <strong>{name || ""}</strong>
                <br />
                {value?.toFixed(2) || "0.00"} €
              </span>,
            ]}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "#ffffff",
              color: "#000000",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: "16px" }}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
