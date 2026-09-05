"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Receipt = {
  id: string;
  expense: string;
  file: string;
  original_filename: string;
  uploaded_at: string;
};

export default function ReportsPage() {
  const now = new Date();

  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const [date, setDate] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateReport() {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("expensebuddy_access");

      if (!token) {
        setError("Please log in again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/reports/monthly/?month=${month}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        let message = "Failed to generate report.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("Content-Disposition");

      let filename = `expense_report_${month}.xlsx`;

      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);

      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFindReceipts() {
    setReceiptError("");
    setReceipts([]);

    if (!date) {
      setReceiptError("Please select a date.");
      return;
    }

    setReceiptLoading(true);

    try {
      const token = localStorage.getItem("expensebuddy_access");

      if (!token) {
        setReceiptError("Please log in again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/receipts/date/?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to find receipts.");
      }

      setReceipts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setReceiptError(
        err instanceof Error ? err.message : "Failed to find receipts.",
      );
    } finally {
      setReceiptLoading(false);
    }
  }
  async function handleDownloadAllReceipts() {
    setReceiptError("");
    setDownloadLoading(true);

    try {
      const token = localStorage.getItem("expensebuddy_access");

      if (!token) {
        setReceiptError("Please log in again.");
        return;
      }

      if (!date) {
        setReceiptError("Please select a date first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/receipts/date/download/?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        let message = "Failed to download receipts.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `receipts_${date}.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setReceiptError(
        err instanceof Error ? err.message : "Failed to download receipts.",
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">ExpenseBuddy</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Monthly Expense Report
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Select a month to generate your Excel expense report.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="report-month"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Report month
              </label>

              <input
                id="report-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xs"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading || !month}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Generating report..." : "Generate Excel Report"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">ExpenseBuddy</p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Receipts by Date
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Select a date to find receipts attached to expenses on that date.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="receipt-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Receipt date
              </label>

              <input
                id="receipt-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xs"
              />
            </div>

            {receiptError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {receiptError}
              </div>
            )}

            <button
              type="button"
              onClick={handleFindReceipts}
              disabled={receiptLoading || !date}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {receiptLoading ? "Finding receipts..." : "Find Receipts"}
            </button>

            {date && !receiptLoading && receipts.length === 0 && (
              <p className="text-sm text-slate-500">
                No receipts found for this date.
              </p>
            )}

            {receipts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Receipts found: {receipts.length}
                </h3>
                <button
      type="button"
      onClick={handleDownloadAllReceipts}
      disabled={downloadLoading}
      className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {downloadLoading
        ? "Preparing ZIP..."
        : "Download All Receipts"}
    </button>

                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {receipt.original_filename}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Expense: {receipt.expense}
                      </p>
                    </div>

                    <a
                      href={receipt.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
                    >
                      View Receipt
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
