import { useState, useRef, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatMonth = (month: string) => {
    const formatted = new Date(month + "-01").toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
      >
        <span className="text-base font-semibold text-gray-800 dark:text-white">
          {formatMonth(activeMonth)}
        </span>
        {/* Arrow icon - rotates when open */}
        <span
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          {availableMonths.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              Aucun mois disponible
            </p>
          ) : (
            availableMonths.map((month) => (
              <button
                key={month}
                onClick={() => {
                  onChange(month);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${
                    month === activeMonth
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {formatMonth(month)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
