interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ backgroundColor: darkMode ? "#6366f1" : "#d1d5db" }}
      aria-label="Basculer en dark mode"
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow
          transition-transform duration-300
          ${darkMode ? "translate-x-7" : "translate-x-0"}
        `}
      />
      <span className="absolute inset-0 flex items-center justify-between px-1 text-xs">
        <span className={darkMode ? "opacity-0" : "opacity-100"}>☀️</span>
        <span className={darkMode ? "opacity-100" : "opacity-0"}>🌙</span>
      </span>
    </button>
  );
}
