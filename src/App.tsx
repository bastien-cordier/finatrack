import { useState, useCallback, useMemo, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useDarkMode } from "./hooks/useDarkMode";
import { useModal } from "./hooks/useModal";
import { useToast } from "./hooks/useToast";
import { formatMonth } from "./lib/helpers";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { MonthSelector } from "./components/ui/MonthSelector";
import { YearSelector } from "./components/ui/YearSelector";
import { FAB } from "./components/ui/FAB";
import { Modal } from "./components/ui/Modal";
import { ExportModal } from "./components/ui/ExportModal";
import { ImportModal } from "./components/ui/ImportModal";
import { WelcomeModal } from "./components/ui/WelcomeModal";
import { Toast } from "./components/ui/Toast";
import { TransactionForm } from "./components/forms/TransactionForm";
import { TransactionList } from "./components/dashboard/TransactionList";
import { SummaryCards } from "./components/dashboard/SummaryCards";
import { SharedExpensesView } from "./components/dashboard/SharedExpensesView";
import { AnnualView } from "./components/dashboard/AnnualView";
import { ExpensePieChart } from "./components/charts/ExpensePieChart";
import { PersonSettings } from "./components/ui/PersonSettings";
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
  getActivePerson,
  saveActivePerson,
  isFirstVisit,
  markWelcomed,
} from "./lib/storage";
import type { Transaction } from "./types";

function AppContent() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const transactionModal = useModal();
  const exportModal = useModal();
  const importModal = useModal();
  const settingsModal = useModal();
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
  const [activePerson, setActivePerson] = useState<string | null>(() => {
    const initialConfig = getConfig();
    const saved = getActivePerson();
    if (saved && initialConfig.persons.some((p) => p.id === saved)) return saved;
    if (initialConfig.persons.length === 2) return initialConfig.persons[0].id;
    return null;
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    const initialConfig = getConfig();
    const hasCustomName = initialConfig.persons.some((p) => p.name !== "Vous");
    if (hasCustomName) {
      markWelcomed();
      return false;
    }
    return isFirstVisit();
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    saveActivePerson(activePerson);
  }, [activePerson]);

  const refreshTransactions = useCallback(() => {
    setTransactions(getTransactions());
  }, []);

  const handleWelcomeSubmit = (name: string) => {
    const updatedPersons = config.persons.map((p, i) =>
      i === 0 ? { ...p, name } : p,
    );
    savePersons(updatedPersons);
    const newConfig = getConfig();
    setConfig(newConfig);
    setActivePerson(newConfig.persons[0].id);
    markWelcomed();
    setShowWelcome(false);
  };

  const handleSavePersons = (persons: typeof config.persons) => {
    savePersons(persons);
    setConfig(getConfig());

    if (persons.length === 2) {
      setActivePerson(persons[0].id);
    } else {
      setActivePerson(null);
    }

    showToast("Personnes mises à jour !");
  };

  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))];
    return months.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map((t) => t.date.slice(0, 4)))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

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

  // Calculate previous month summary for comparison
  const previousMonth = useMemo(() => {
    const date = new Date(activeMonth + "-01");
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }, [activeMonth]);

  const previousMonthTransactions = useMemo(() => {
    const prevTransactions = transactions.filter((t) =>
      t.date.startsWith(previousMonth),
    );
    if (activePerson === null) {
      return prevTransactions.filter((t) => t.isShared && t.type === "expense");
    }
    return prevTransactions.filter(
      (t) =>
        t.personId === activePerson ||
        (t.isShared && t.paidBy === activePerson),
    );
  }, [transactions, previousMonth, activePerson]);

  const previousMonthlySummary = useMemo(
    () => calculateMonthlySummary(previousMonthTransactions),
    [previousMonthTransactions],
  );

  const [splitPercentages] = useState({
    [config.persons[0]?.id]: 50,
    [config.persons[1]?.id]: 50,
  });

  const sharedSplit = useMemo(
    () => calculateSharedSplit(activeMonthTransactions, splitPercentages),
    [activeMonthTransactions, splitPercentages],
  );

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

  const location = useLocation();
  const isMonthlyView = location.pathname === "/";

  const pageTitle = isMonthlyView ? "Vue Mensuelle" : "Vue Annuelle";
  const pageSubtitle = isMonthlyView ? formatMonth(activeMonth) : activeYear;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onHide={hideToast}
        type={toast.type}
      />

      {/* Sidebar */}
      <Sidebar
        persons={config.persons}
        activePerson={activePerson}
        onSelectPerson={setActivePerson}
        onOpenExport={exportModal.open}
        onOpenImport={importModal.open}
        onOpenSettings={settingsModal.open}
        transactionCount={filteredMonthlyTransactions.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        <Topbar
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenSidebar={() => setSidebarOpen(true)}
          title={pageTitle}
          subtitle={pageSubtitle}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <Routes>
            {/* Monthly view */}
            <Route
              path="/"
              element={
                <>
                  {availableMonths.length > 0 && (
                    <div className="flex justify-between">
                      <div className="text-2xl font-bold">
                        Hello{" "}
                        {config.persons.find((p) => p.id === activePerson)
                          ?.name || "Guest"}{" "}
                        👋🏼
                      </div>
                      <MonthSelector
                        activeMonth={activeMonth}
                        availableMonths={availableMonths}
                        onChange={setActiveMonth}
                      />
                    </div>
                  )}

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
                      <SummaryCards
                        summary={monthlySummary}
                        previousSummary={previousMonthlySummary}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Transactions</h2>
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
                  {availableYears.length > 0 ? (
                    <>
                      <YearSelector
                        activeYear={activeYear}
                        availableYears={availableYears}
                        onChange={setActiveYear}
                      />

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
                      <p className="text-xl text-muted-foreground">
                        Aucune transaction enregistrée
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
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
      </div>

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
          activePersonId={activePerson}
        />
      </Modal>

      <Modal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        title="Paramètres"
      >
        <PersonSettings persons={config.persons} onSave={handleSavePersons} />
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

      <WelcomeModal
        isOpen={showWelcome}
        onSubmit={handleWelcomeSubmit}
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
