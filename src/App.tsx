import { useState, useCallback, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useDarkMode } from "./hooks/useDarkMode";
import { useModal } from "./hooks/useModal";
import { useToast } from "./hooks/useToast";
import { DarkModeToggle } from "./components/ui/DarkModeToggle";
import { MonthSelector } from "./components/ui/MonthSelector";
import { YearSelector } from "./components/ui/YearSelector";
import { PersonSettings } from "./components/ui/PersonSettings";
import { PersonTabs } from "./components/dashboard/PersonTabs";
import { FAB } from "./components/ui/FAB";
import { Modal } from "./components/ui/Modal";
import { ExportModal } from "./components/ui/ExportModal";
import { ImportModal } from "./components/ui/ImportModal";
import { Toast } from "./components/ui/Toast";
import { TransactionForm } from "./components/forms/TransactionForm";
import { TransactionList } from "./components/dashboard/TransactionList";
import { SummaryCards } from "./components/dashboard/SummaryCards";
import { SharedExpensesView } from "./components/dashboard/SharedExpensesView";
import { AnnualView } from "./components/dashboard/AnnualView";
import { ExpensePieChart } from "./components/charts/ExpensePieChart";
import {
  calculateMonthlySummary,
  calculateSharedSplit,
} from "./lib/calculations";
import { exportToJSON, exportToPDF, importFromJSON } from "./lib/export";
import {
  getConfig,
  getTransactions,
  savePersons,
  updateTransaction,
  importTransactions,
} from "./lib/storage";
import type { Transaction } from "./types";

function AppContent() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const transactionModal = useModal();
  const exportModal = useModal();
  const importModal = useModal();
  const { toast, showToast, hideToast } = useToast();

  const [config, setConfig] = useState(() => getConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getTransactions(),
  );
  const [activeMonth, setActiveMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );
  const [activeYear, setActiveYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [activePerson, setActivePerson] = useState<string | null>(
    config.persons.length === 2 ? config.persons[0].id : null,
  );

  const refreshTransactions = useCallback(() => {
    setTransactions(getTransactions());
  }, []);

  const handleSavePersons = (persons: typeof config.persons) => {
    savePersons(persons);
    setConfig(getConfig());

    // Reset activePerson if needed
    if (persons.length === 2) {
      setActivePerson(persons[0].id);
    } else {
      setActivePerson(null);
    }

    showToast("Personnes mises à jour !");
  };

  // Available months and years (only non-empty)
  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))];
    return months.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map((t) => t.date.slice(0, 4)))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Monthly view data
  const activeMonthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(activeMonth)),
    [transactions, activeMonth],
  );

  const filteredMonthlyTransactions = useMemo(() => {
    if (activePerson === null) {
      return activeMonthTransactions.filter(
        (t) => t.isShared && t.type === "expense",
      );
    }
    return activeMonthTransactions.filter(
      (t) =>
        t.personId === activePerson ||
        (t.isShared && t.paidBy === activePerson),
    );
  }, [activeMonthTransactions, activePerson]);

  const monthlySummary = useMemo(
    () => calculateMonthlySummary(filteredMonthlyTransactions),
    [filteredMonthlyTransactions],
  );

  const [splitPercentages] = useState({
    [config.persons[0]?.id]: 50,
    [config.persons[1]?.id]: 50,
  });

  const sharedSplit = useMemo(
    () => calculateSharedSplit(activeMonthTransactions, splitPercentages),
    [activeMonthTransactions, splitPercentages],
  );

  // Annual view data
  const activeYearTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(activeYear)),
    [transactions, activeYear],
  );

  const filteredAnnualTransactions = useMemo(() => {
    if (activePerson === null) {
      return activeYearTransactions;
    }
    return activeYearTransactions.filter(
      (t) =>
        t.personId === activePerson ||
        (t.isShared && t.paidBy === activePerson),
    );
  }, [activeYearTransactions, activePerson]);

  // Handlers
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    transactionModal.open();
  };

  const handleCloseTransactionModal = () => {
    setEditingTransaction(null);
    transactionModal.close();
  };

  const handleMakeShared = useCallback(
    (transactionId: string, paidBy: string) => {
      const transaction = transactions.find((t) => t.id === transactionId);
      if (!transaction) return;

      const updatedTransaction: Transaction = {
        ...transaction,
        isShared: true,
        personId: null,
        paidBy: paidBy,
      };

      updateTransaction(updatedTransaction);
      refreshTransactions();
      showToast("Transaction rendue commune !");
    },
    [transactions, refreshTransactions, showToast],
  );

  const handleExportJSON = async (encrypt: boolean, password?: string) => {
    // Get person name if filtering by person
    const personName = activePerson
      ? config.persons.find((p) => p.id === activePerson)?.name
      : undefined;

    await exportToJSON(
      filteredMonthlyTransactions,
      activeMonth,
      encrypt,
      password,
      personName,
    );
    showToast(
      encrypt ? "Export JSON chiffré réussi !" : "Export JSON réussi !",
    );
  };

  const handleExportPDF = () => {
    // Get person name if filtering by person
    const personName = activePerson
      ? config.persons.find((p) => p.id === activePerson)?.name
      : undefined;

    exportToPDF(
      filteredMonthlyTransactions,
      monthlySummary,
      activeMonth,
      personName,
    );
    showToast("Export PDF réussi !");
  };

  const handleImportJSON = async (file: File, password?: string) => {
    const { transactions: importedTransactions, month } = await importFromJSON(
      file,
      password,
    );

    const shouldReplace = window.confirm(
      `Importer ${importedTransactions.length} transaction(s) pour ${month}.\n\n` +
        `Voulez-vous REMPLACER toutes les transactions de ce mois ?\n` +
        `(Cliquez sur "Annuler" pour FUSIONNER avec les transactions existantes)`,
    );

    importTransactions(importedTransactions, month, shouldReplace);
    refreshTransactions();

    showToast(`${importedTransactions.length} transaction(s) importée(s) !`);

    setActiveMonth(month);
  };

  const isMonthlyView = location.pathname === "/";
  const isAnnualView = location.pathname === "/annual";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onHide={hideToast}
        type={toast.type}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ma Comptabilité
            </h1>
            <div className="flex items-center gap-3">
              {/* Navigation buttons */}
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isMonthlyView
                    ? "bg-indigo-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                📅 Mensuel
              </Link>
              <Link
                to="/annual"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isAnnualView
                    ? "bg-indigo-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                📊 Annuel
              </Link>
              <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
            </div>
          </div>

          {/* Person settings - only in monthly view */}
          {isMonthlyView && (
            <PersonSettings
              persons={config.persons}
              onSave={handleSavePersons}
            />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 flex flex-col gap-6">
        <Routes>
          {/* Monthly view */}
          <Route
            path="/"
            element={
              <>
                {/* Month selector + Export/Import buttons */}
                {availableMonths.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <MonthSelector
                        activeMonth={activeMonth}
                        availableMonths={availableMonths}
                        onChange={setActiveMonth}
                      />
                    </div>
                    <button
                      onClick={importModal.open}
                      className="px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:border-green-300 dark:hover:border-green-600 transition-colors flex items-center gap-2"
                    >
                      <span>📥</span>
                      <span>Importer</span>
                    </button>
                    <button
                      onClick={exportModal.open}
                      className="px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <span>📤</span>
                      <span>Exporter</span>
                    </button>
                  </div>
                )}

                {/* Person tabs */}
                <PersonTabs
                  persons={config.persons}
                  activePerson={activePerson}
                  onSelectPerson={setActivePerson}
                />

                {/* Dashboard */}
                {config.persons.length === 2 && activePerson === null ? (
                  <SharedExpensesView
                    persons={config.persons}
                    sharedTotal={sharedSplit.sharedTotal}
                    sharedByCategory={sharedSplit.sharedByCategory}
                    paidByPerson={sharedSplit.paidByPerson}
                    shouldPay={sharedSplit.shouldPay}
                    balance={sharedSplit.balance}
                  />
                ) : (
                  <>
                    <SummaryCards summary={monthlySummary} />
                    <div className="grid grid-cols-2 gap-4">
                      <ExpensePieChart
                        data={monthlySummary.expensesByCategory}
                        title="Répartition des dépenses"
                      />
                      <ExpensePieChart
                        data={monthlySummary.incomeByCategory}
                        title="Répartition des revenus"
                      />
                    </div>
                  </>
                )}

                {/* Transaction list */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-400 dark:text-gray-500 text-right">
                    {filteredMonthlyTransactions.length} transaction
                    {filteredMonthlyTransactions.length !== 1 ? "s" : ""}
                  </span>
                  <TransactionList
                    transactions={filteredMonthlyTransactions}
                    onDelete={refreshTransactions}
                    onEdit={handleEdit}
                    isSharedView={
                      config.persons.length === 2 && activePerson === null
                    }
                    persons={config.persons}
                    activePersonId={activePerson}
                    onMakeShared={handleMakeShared}
                  />
                </div>
              </>
            }
          />

          {/* Annual view */}
          <Route
            path="/annual"
            element={
              <>
                {/* Year selector */}
                {availableYears.length > 0 ? (
                  <>
                    <YearSelector
                      activeYear={activeYear}
                      availableYears={availableYears}
                      onChange={setActiveYear}
                    />

                    {/* Person tabs - only if 2 persons */}
                    {config.persons.length === 2 && (
                      <PersonTabs
                        persons={config.persons}
                        activePerson={activePerson}
                        onSelectPerson={setActivePerson}
                        hideSharedTab={true}
                      />
                    )}

                    {/* Annual dashboard */}
                    <AnnualView
                      transactions={filteredAnnualTransactions}
                      year={activeYear}
                      personName={
                        activePerson
                          ? config.persons.find((p) => p.id === activePerson)
                              ?.name
                          : undefined
                      }
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <span className="text-8xl mb-6">📊</span>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                      Aucune transaction enregistrée
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Commencez par ajouter des transactions dans la vue
                      mensuelle
                    </p>
                  </div>
                )}
              </>
            }
          />
        </Routes>
      </main>

      {/* FAB - only in monthly view */}
      {isMonthlyView && <FAB onClick={transactionModal.open} />}

      {/* Modals */}
      <Modal
        isOpen={transactionModal.isOpen}
        onClose={handleCloseTransactionModal}
        title={
          editingTransaction
            ? "Modifier la transaction"
            : "Nouvelle transaction"
        }
      >
        <TransactionForm
          persons={config.persons}
          onSubmit={refreshTransactions}
          onShowToast={showToast}
          editingTransaction={editingTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      </Modal>

      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={exportModal.close}
        onExportJSON={handleExportJSON}
        onExportPDF={handleExportPDF}
      />

      <ImportModal
        isOpen={importModal.isOpen}
        onClose={importModal.close}
        onImport={handleImportJSON}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
