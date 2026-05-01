import type { Transaction, MonthlyResume } from "../../types";

// -----------------------------------------------------------
// Crypto utilities for encrypted exports
// -----------------------------------------------------------

// PBKDF2 iteration count. OWASP 2023 recommandation pour SHA-256.
// Stocké dans le blob chiffré (cf. format ci-dessous) pour permettre une augmentation
// future sans casser les anciens fichiers : on lit la valeur du fichier au déchiffrement.
const PBKDF2_ITERATIONS = 600_000;
const LEGACY_PBKDF2_ITERATIONS = 100_000;

// Format du blob chiffré (base64) :
//   v2 : [magic 'FH2' (3o)] [salt 16o] [iv 12o] [iterations BE32 4o] [ciphertext]
//   v1 (legacy, pour compat) : [salt 16o] [iv 12o] [ciphertext]  → 100k itérations
const MAGIC_V2 = new Uint8Array([0x46, 0x48, 0x32]); // "FH2"

// Generate a key from a password using PBKDF2
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Encrypt data with AES-256-GCM (format v2)
async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = PBKDF2_ITERATIONS;
  const key = await deriveKey(password, salt, iterations);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(data),
  );

  const iterBytes = new Uint8Array(4);
  new DataView(iterBytes.buffer).setUint32(0, iterations, false);

  const combined = new Uint8Array(
    MAGIC_V2.length + salt.length + iv.length + iterBytes.length + encrypted.byteLength,
  );
  let offset = 0;
  combined.set(MAGIC_V2, offset);
  offset += MAGIC_V2.length;
  combined.set(salt, offset);
  offset += salt.length;
  combined.set(iv, offset);
  offset += iv.length;
  combined.set(iterBytes, offset);
  offset += iterBytes.length;
  combined.set(new Uint8Array(encrypted), offset);

  return bytesToBase64(combined);
}

// Decrypt data (auto-détecte v1 legacy / v2)
async function decryptData(
  encryptedBase64: string,
  password: string,
): Promise<string> {
  const combined = base64ToBytes(encryptedBase64);

  let salt: Uint8Array;
  let iv: Uint8Array;
  let iterations: number;
  let encrypted: Uint8Array;

  const hasMagic =
    combined.length >= MAGIC_V2.length &&
    combined[0] === MAGIC_V2[0] &&
    combined[1] === MAGIC_V2[1] &&
    combined[2] === MAGIC_V2[2];

  if (hasMagic) {
    if (combined.length < MAGIC_V2.length + 16 + 12 + 4) {
      throw new Error("Fichier chiffré corrompu.");
    }
    let offset = MAGIC_V2.length;
    salt = combined.slice(offset, offset + 16);
    offset += 16;
    iv = combined.slice(offset, offset + 12);
    offset += 12;
    iterations = new DataView(
      combined.buffer,
      combined.byteOffset + offset,
      4,
    ).getUint32(0, false);
    offset += 4;
    encrypted = combined.slice(offset);
    if (iterations < 50_000 || iterations > 10_000_000) {
      throw new Error("Fichier chiffré corrompu.");
    }
  } else {
    if (combined.length < 16 + 12) {
      throw new Error("Fichier chiffré corrompu.");
    }
    salt = combined.slice(0, 16);
    iv = combined.slice(16, 28);
    encrypted = combined.slice(28);
    iterations = LEGACY_PBKDF2_ITERATIONS;
  }

  const key = await deriveKey(password, salt, iterations);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      encrypted as BufferSource,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error("Décryptage échoué. Mot de passe incorrect ?");
  }
}

// -----------------------------------------------------------
// Export transactions as encrypted JSON file
// -----------------------------------------------------------
export async function exportToJSON(
  transactions: Transaction[],
  month: string,
  encrypt: boolean = false,
  password?: string,
  personName?: string,
): Promise<void> {
  const data = {
    month,
    exportDate: new Date().toISOString(),
    transactions,
    encrypted: encrypt,
  };

  let content: string;
  let filename: string;

  // Build filename with person name if provided
  const namePrefix = personName ? `${personName}_` : "";

  if (encrypt && password) {
    // Encrypt the data
    const jsonString = JSON.stringify(data);
    content = await encryptData(jsonString, password);
    filename = `recap-compta_${namePrefix}${month}.encrypted.json`;
  } else {
    // Plain JSON
    content = JSON.stringify(data, null, 2);
    filename = `recap-compta_${namePrefix}${month}.json`;
  }

  const blob = new Blob([content], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const VALID_TYPES = new Set<Transaction["type"]>([
  "expense",
  "income",
  "savings",
]);
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_AMOUNT = 1_000_000_000; // 1 milliard €

const VALID_CATEGORIES_BY_TYPE: Record<Transaction["type"], Set<string>> = {
  expense: new Set<string>([
    "Courses",
    "Restaurants / Fast-food",
    "Cantine",
    "Voiture",
    "Logement",
    "Santé",
    "Assurances",
    "Sport",
    "Divertissement",
    "Shopping",
    "Abonnements",
    "Vacances",
    "Utilitaires",
    "Autres",
  ]),
  income: new Set<string>([
    "Salaire",
    "Cadeaux",
    "Remboursements maladie",
    "Remboursements classique",
    "Autres",
  ]),
  savings: new Set<string>(["Épargne"]),
};

function validateImportedData(
  data: unknown,
  validPersonIds: Set<string>,
): {
  transactions: Transaction[];
  month: string;
} {
  if (!data || typeof data !== "object") {
    throw new Error("Format de fichier invalide.");
  }
  const d = data as Record<string, unknown>;

  if (typeof d.month !== "string" || !MONTH_REGEX.test(d.month)) {
    throw new Error("Le champ 'month' est manquant ou invalide.");
  }
  if (!Array.isArray(d.transactions)) {
    throw new Error("Le champ 'transactions' est manquant ou invalide.");
  }

  const transactions: Transaction[] = d.transactions.map((t: unknown, i) => {
    if (!t || typeof t !== "object") {
      throw new Error(`Transaction #${i + 1} invalide.`);
    }
    const tx = t as Record<string, unknown>;

    if (typeof tx.id !== "string" || !ID_REGEX.test(tx.id)) {
      throw new Error(`Transaction #${i + 1} : 'id' invalide.`);
    }
    if (
      typeof tx.amount !== "number" ||
      !isFinite(tx.amount) ||
      tx.amount <= 0 ||
      tx.amount > MAX_AMOUNT
    ) {
      throw new Error(`Transaction #${i + 1} : montant invalide.`);
    }
    if (typeof tx.date !== "string" || !DATE_REGEX.test(tx.date)) {
      throw new Error(`Transaction #${i + 1} : date invalide.`);
    }
    if (typeof tx.type !== "string" || !VALID_TYPES.has(tx.type as Transaction["type"])) {
      throw new Error(`Transaction #${i + 1} : type invalide.`);
    }
    const txType = tx.type as Transaction["type"];
    if (
      typeof tx.category !== "string" ||
      !VALID_CATEGORIES_BY_TYPE[txType].has(tx.category)
    ) {
      throw new Error(
        `Transaction #${i + 1} : catégorie invalide pour le type "${txType}".`,
      );
    }
    if (typeof tx.isShared !== "boolean") {
      throw new Error(`Transaction #${i + 1} : 'isShared' invalide.`);
    }

    const personId =
      typeof tx.personId === "string" && validPersonIds.has(tx.personId)
        ? tx.personId
        : null;
    const paidBy =
      typeof tx.paidBy === "string" && validPersonIds.has(tx.paidBy)
        ? tx.paidBy
        : null;

    return {
      id: tx.id,
      amount: tx.amount,
      date: tx.date,
      category: tx.category as Transaction["category"],
      type: txType,
      description:
        typeof tx.description === "string" ? tx.description.slice(0, 500) : "",
      isShared: tx.isShared,
      personId: tx.isShared ? null : personId,
      paidBy: tx.isShared ? paidBy : null,
    };
  });

  return { transactions, month: d.month };
}

// -----------------------------------------------------------
// Import and decrypt JSON file
// -----------------------------------------------------------
export async function importFromJSON(
  file: File,
  password: string | undefined,
  validPersonIds: string[],
): Promise<{ transactions: Transaction[]; month: string }> {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 5 Mo).");
  }

  const validIds = new Set(validPersonIds);
  const text = await file.text();

  // Tentative de parsing JSON (fichier non chiffré)
  let parsed: unknown = null;
  let isValidJson = false;
  try {
    parsed = JSON.parse(text);
    isValidJson = true;
  } catch {
    isValidJson = false;
  }

  if (isValidJson && parsed && !(parsed as Record<string, unknown>).encrypted) {
    return validateImportedData(parsed, validIds);
  }

  // Fichier chiffré
  if (!password) {
    throw new Error("Ce fichier est chiffré. Mot de passe requis.");
  }

  const decrypted = await decryptData(text, password);
  const decryptedData = JSON.parse(decrypted);
  return validateImportedData(decryptedData, validIds);
}

// -----------------------------------------------------------
// Export monthly report as PDF
// -----------------------------------------------------------
export async function exportToPDF(
  transactions: Transaction[],
  summary: MonthlyResume,
  month: string,
  personName?: string,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();

  // Format month for display
  const formattedMonth = new Date(month + "-01").toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const displayMonth =
    formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // --- HEADER ---
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport Mensuel", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(displayMonth, 105, 23, { align: "center" });

  // Add person name if provided
  if (personName) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(personName, 105, 29, { align: "center" });
  }

  // --- SUMMARY CARDS (4 blocks in a row) ---
  const startY = personName ? 38 : 35;
  const cardWidth = 45;
  const cardHeight = 20;
  const gap = 3;

  const cards = [
    {
      label: "Revenus",
      value: summary.totalIncome,
      color: [16, 185, 129],
    },
    {
      label: "Dépenses",
      value: summary.totalExpenses,
      color: [239, 68, 68],
    },
    {
      label: "Épargne",
      value: summary.totalSavings,
      color: [59, 130, 246],
    },
    {
      label: "Solde",
      value: summary.balance,
      color: summary.balance >= 0 ? [16, 185, 129] : [239, 68, 68],
    },
  ];

  cards.forEach((card, index) => {
    const x = 10 + index * (cardWidth + gap);
    const y = startY;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(card.label, x + cardWidth / 2, y + 6, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(`${card.value.toFixed(2)} €`, x + cardWidth / 2, y + 15, {
      align: "center",
    });
  });

  // --- PIE CHARTS SECTION (text-based summary) ---
  let currentY = startY + cardHeight + 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Répartition par catégorie", 10, currentY);
  currentY += 7;

  // Expenses breakdown
  if (Object.keys(summary.expensesByCategory).length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("Dépenses :", 10, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    Object.entries(summary.expensesByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, amount]) => {
        const percentage = summary.expensePercentages[cat] || 0;
        doc.text(
          `• ${cat}: ${(amount as number).toFixed(2)} € (${percentage.toFixed(1)}%)`,
          15,
          currentY,
        );
        currentY += 5;
      });
    currentY += 3;
  }

  // Income breakdown
  if (Object.keys(summary.incomeByCategory).length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("Revenus :", 10, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    Object.entries(summary.incomeByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, amount]) => {
        const percentage = summary.incomePercentages[cat] || 0;
        doc.text(
          `• ${cat}: ${(amount as number).toFixed(2)} € (${percentage.toFixed(1)}%)`,
          15,
          currentY,
        );
        currentY += 5;
      });
    currentY += 3;
  }

  // Savings breakdown
  if (Object.keys(summary.savingsByCategory).length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("Épargne :", 10, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    Object.entries(summary.savingsByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, amount]) => {
        const percentage = summary.savingsPercentages[cat] || 0;
        doc.text(
          `• ${cat}: ${(amount as number).toFixed(2)} € (${percentage.toFixed(1)}%)`,
          15,
          currentY,
        );
        currentY += 5;
      });
    currentY += 3;
  }

  // --- TRANSACTIONS TABLE ---
  currentY += 5;

  const tableData = transactions.map((t) => {
    const typeLabel =
      t.type === "expense"
        ? "Dépense"
        : t.type === "income"
          ? "Revenu"
          : "Épargne";
    const formattedDate = new Date(t.date + "T00:00:00").toLocaleDateString(
      "fr-FR",
      { day: "2-digit", month: "2-digit", year: "numeric" },
    );
    const sharedLabel = t.isShared ? "Oui" : "Non";
    return [
      typeLabel,
      t.category,
      formattedDate,
      t.description || "—",
      `${t.amount.toFixed(2)} €`,
      sharedLabel,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Type", "Catégorie", "Date", "Description", "Montant", "Commun"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
  });

  // --- FOOTER ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} / ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
      105,
      doc.internal.pageSize.height - 5,
      { align: "center" },
    );
  }

  // Download
  const namePrefix = personName ? `${personName}_` : "";
  doc.save(`rapport_${namePrefix}${month}.pdf`);
}
