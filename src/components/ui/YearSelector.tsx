import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearSelectorProps {
  activeYear: string;
  availableYears: string[];
  onChange: (year: string) => void;
}

export function YearSelector({
  activeYear,
  availableYears,
  onChange,
}: YearSelectorProps) {
  const currentYearIndex = availableYears.indexOf(activeYear);
  const canGoPrev = currentYearIndex < availableYears.length - 1;
  const canGoNext = currentYearIndex > 0;

  const handlePrev = () => {
    if (canGoPrev) {
      onChange(availableYears[currentYearIndex + 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onChange(availableYears[currentYearIndex - 1]);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={!canGoPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[100px] text-center">
        <span className="text-3xl font-bold">{activeYear}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
