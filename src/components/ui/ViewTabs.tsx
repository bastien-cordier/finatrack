type ViewMode = "monthly" | "annual";

interface ViewTabsProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
      <button
        onClick={() => onViewChange("monthly")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeView === "monthly"
            ? "bg-indigo-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <span>📅</span>
        <span>Mensuel</span>
      </button>

      <button
        onClick={() => onViewChange("annual")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeView === "annual"
            ? "bg-indigo-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <span>📊</span>
        <span>Annuel</span>
      </button>
    </div>
  );
}

export type { ViewMode };