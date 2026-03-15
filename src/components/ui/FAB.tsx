interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-indigo-500 hover:bg-indigo-600
        dark:bg-indigo-600 dark:hover:bg-indigo-700
        text-white text-3xl font-light
        shadow-lg hover:shadow-xl
        transition-all duration-200
        hover:scale-110
        flex items-center justify-center
      "
      aria-label="Ajouter une transaction"
    >
      +
    </button>
  );
}
