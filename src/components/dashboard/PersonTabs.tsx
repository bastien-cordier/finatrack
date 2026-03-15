import type { Person } from "../../types";

interface PersonTabsProps {
  persons: Person[];
  activePerson: string | null;
  onSelectPerson: (personId: string | null) => void;
  hideSharedTab?: boolean;
}

export function PersonTabs({
  persons,
  activePerson,
  onSelectPerson,
  hideSharedTab = false,
}: PersonTabsProps) {
  if (persons.length < 2) return null;

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
      {/* Shared expenses tab - hidden in annual view */}
      {!hideSharedTab && (
        <button
          onClick={() => onSelectPerson(null)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activePerson === null
              ? "bg-indigo-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Dépenses communes
        </button>
      )}

      {/* Person tabs */}
      {persons.map((person) => (
        <button
          key={person.id}
          onClick={() => onSelectPerson(person.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activePerson === person.id
              ? "bg-indigo-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {person.name}
        </button>
      ))}
    </div>
  );
}
