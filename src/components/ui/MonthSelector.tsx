import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Calendar } from "lucide-react";

interface MonthSelectorProps {
  activeMonth: string;
  availableMonths: string[];
  onChange: (month: string) => void;
}

export function MonthSelector({
  activeMonth,
  availableMonths,
  onChange,
}: MonthSelectorProps) {
  // Format month for display
  const formatMonth = (month: string) => {
    const date = new Date(month + "-01");
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Select value={activeMonth} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <SelectValue placeholder="Sélectionner un mois" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableMonths.map((month) => (
          <SelectItem key={month} value={month}>
            {formatMonth(month)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
