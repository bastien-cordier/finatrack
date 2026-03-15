import { useEffect, useRef, useState } from "react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, password?: string) => Promise<void>;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleClose = () => {
    setSelectedFile(null);
    setPassword("");
    setIsEncrypted(false);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    // Check if file is encrypted based on filename
    setIsEncrypted(file.name.includes(".encrypted."));
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      await onImport(selectedFile, isEncrypted ? password : undefined);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Importer des données
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ <strong>Attention :</strong> L'import remplacera toutes vos
            données existantes pour le mois concerné.
          </p>
        </div>

        {/* File selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionnez un fichier JSON
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">📁</span>
                <span>Cliquez pour choisir un fichier</span>
              </div>
            )}
          </button>
        </div>

        {/* Password input for encrypted files */}
        {isEncrypted && selectedFile && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔒 Fichier chiffré - Mot de passe requis
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || (isEncrypted && !password) || isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Import en cours..." : "Importer"}
          </button>
        </div>
      </div>
    </div>
  );
}
