import { useEffect, useMemo, useRef, useState } from "react";

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function evaluatePasswordStrength(password: string): {
  level: StrengthLevel;
  label: string;
  colorClass: string;
} {
  if (!password) {
    return { level: 0, label: "", colorClass: "bg-gray-200 dark:bg-gray-600" };
  }

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < 12) score = Math.min(score, 1);

  const level = Math.min(score, 4) as StrengthLevel;
  const meta: Record<StrengthLevel, { label: string; colorClass: string }> = {
    0: { label: "Très faible", colorClass: "bg-red-500" },
    1: { label: "Faible", colorClass: "bg-red-500" },
    2: { label: "Moyen", colorClass: "bg-amber-500" },
    3: { label: "Bon", colorClass: "bg-emerald-500" },
    4: { label: "Excellent", colorClass: "bg-emerald-600" },
  };
  return { level, ...meta[level] };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: (encrypt: boolean, password?: string) => void;
  onExportPDF: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  onExportJSON,
  onExportPDF,
}: ExportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        resetState();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const resetState = () => {
    setShowPasswordInput(false);
    setPassword("");
    setConfirmPassword("");
  };

  const handleJSONClick = () => {
    setShowPasswordInput(true);
  };

  const handleJSONExport = (encrypt: boolean) => {
    if (encrypt) {
      if (!password) {
        alert("Veuillez entrer un mot de passe");
        return;
      }
      if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas");
        return;
      }
      if (password.length < 12) {
        alert("Le mot de passe doit contenir au moins 12 caractères");
        return;
      }
    }

    onExportJSON(encrypt, encrypt ? password : undefined);
    onClose();
    resetState();
  };

  if (!isOpen) return null;

  if (showPasswordInput) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => {
          onClose();
          resetState();
        }}
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Chiffrement (optionnel)
            </h2>
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Pour protéger vos données, vous pouvez chiffrer le fichier avec un
            mot de passe.
          </p>

          {/* Password inputs */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe (min. 12 caractères)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laissez vide pour export non chiffré"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength.level
                            ? strength.colorClass
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    Force : <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleJSONExport(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Sans chiffrement
            </button>
            <button
              onClick={() => handleJSONExport(true)}
              disabled={
                !password || password !== confirmPassword || password.length < 12
              }
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Chiffrer et exporter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Exporter les données
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Export options */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleJSONClick}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <span className="text-2xl">🔒</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Format JSON (chiffré)
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Backup sécurisé de vos données
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              onExportPDF();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <span className="text-2xl">📑</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Format PDF
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Rapport mensuel complet
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
