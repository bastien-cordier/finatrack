import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "./card";
import { formatCurrency } from "../../lib/helpers";

interface StatCardProps {
  label: string;
  value: number;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  valueColorClass?: string;
  comparisonLabel: string;
  showChange: boolean;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  iconColor,
  bgColor,
  valueColorClass,
  comparisonLabel,
  showChange,
}: StatCardProps) {
  const isPositive = change > 0;

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p
              className={`text-3xl font-bold tracking-tight ${valueColorClass ?? ""}`}
            >
              {formatCurrency(value)} €
            </p>
            {showChange && change !== 0 && (
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {comparisonLabel}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${bgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
