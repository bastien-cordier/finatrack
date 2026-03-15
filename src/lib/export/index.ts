import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction, MonthlyResume } from "../../types";

// -----------------------------------------------------------
// Crypto utilities for encrypted exports
// -----------------------------------------------------------

// Generate a key from a password using PBKDF2
async function deriveKey(
  password: string,
  salt: Uint8Array,
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
      salt: salt as BufferSource, // Cast explicite
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Encrypt data with AES-256-GCM
async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(data),
  );

  // Combine salt + iv + encrypted data into a single buffer
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64 for easy storage/transport
  return btoa(String.fromCharCode(...combined));
}

// Decrypt data
async function decryptData(
  encryptedBase64: string,
  password: string,
): Promise<string> {
  // Decode base64 string to binary
  const binaryString = atob(encryptedBase64);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encrypted,
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

// -----------------------------------------------------------
// Import and decrypt JSON file
// -----------------------------------------------------------
export async function importFromJSON(
  file: File,
  password?: string,
): Promise<{ transactions: Transaction[]; month: string }> {
  const text = await file.text();

  try {
    // Try to parse as plain JSON first
    const data = JSON.parse(text);

    if (data.encrypted) {
      throw new Error(
        "Ce fichier est chiffré. Veuillez fournir un mot de passe.",
      );
    }

    return {
      transactions: data.transactions,
      month: data.month,
    };
  } catch {
    // If parsing fails, assume it's encrypted
    if (!password) {
      throw new Error("Ce fichier est chiffré. Mot de passe requis.");
    }

    const decrypted = await decryptData(text, password);
    const data = JSON.parse(decrypted);

    return {
      transactions: data.transactions,
      month: data.month,
    };
  }
}

// -----------------------------------------------------------
// Export monthly report as PDF
// -----------------------------------------------------------
export function exportToPDF(
  transactions: Transaction[],
  summary: MonthlyResume,
  month: string,
  personName?: string,
): void {
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
