import { useState } from "react";
import type { Person } from "../../types";

interface PersonSettingsProps {
  persons: Person[];
  onSave: (persons: Person[]) => void;
}

export function PersonSettings({ persons, onSave }: PersonSettingsProps) {
  const [localPersons, setLocalPersons] = useState<Person[]>(persons);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddPerson = () => {
    if (localPersons.length >= 2) return; // Max 2 persons

    const newPerson: Person = {
      id: `person_${Date.now()}`,
      name: `Personne ${localPersons.length + 1}`,
    };
    setLocalPersons([...localPersons, newPerson]);
  };

  const handleRemovePerson = (id: string) => {
    if (localPersons.length <= 1) return; // Min 1 person
    setLocalPersons(localPersons.filter((p) => p.id !== id));
  };

  const handleUpdateName = (id: string, name: string) => {
    setLocalPersons(
      localPersons.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  };

  const handleSave = () => {
    onSave(localPersons);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalPersons(persons);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {persons.map((person) => (
            <span
              key={person.id}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
            >
              {person.name}
            </span>
          ))}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
          Personnes
        </span>
        {localPersons.length < 2 && (
          <button
            onClick={handleAddPerson}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Ajouter
          </button>
        )}
      </div>

      {localPersons.map((person) => (
        <div key={person.id} className="flex items-center gap-2">
          <input
            type="text"
            value={person.name}
            onChange={(e) => handleUpdateName(person.id, e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nom"
          />
          {localPersons.length > 1 && (
            <button
              onClick={() => handleRemovePerson(person.id)}
              className="text-red-500 hover:text-red-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
