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
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
      {/* Previous year button */}
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {/* Current year display */}
      <span className="text-2xl font-bold text-gray-800 dark:text-white min-w-25 text-center">
        {activeYear}
      </span>

      {/* Next year button */}
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
}
