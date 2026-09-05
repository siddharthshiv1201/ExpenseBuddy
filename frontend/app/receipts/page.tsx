"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  FileText,
  Loader2,
  ReceiptText,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api/client";
import type { Expense } from "@/types/expense";

interface Receipt {
  id: string;
  expense: string;
  file: string;
  original_filename: string;
  uploaded_at: string;
}

export default function ReceiptsPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] =
    useState<string>("");

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const token = localStorage.getItem(
  "expensebuddy_access",
);

if (!token) {
  router.replace("/login");
  return;
}

const accessToken = token;
    async function loadExpenses() {
      try {
        const data = await apiFetch<Expense[]>(
          "/api/expenses/",
          { token: accessToken },
        );

        setExpenses(data);

        if (data.length > 0) {
          setSelectedExpense(data[0].id);
        }
      } catch (requestError) {
        const error = requestError as Error & {
          status?: number;
        };

        if (
          error.status === 401 ||
          error.status === 403
        ) {
          localStorage.removeItem(
            "expensebuddy_access",
          );
          localStorage.removeItem(
            "expensebuddy_refresh",
          );
          localStorage.removeItem(
            "expensebuddy_user",
          );

          router.replace("/login");
          return;
        }

        toast.error("Unable to load your expenses.");
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [router]);

  useEffect(() => {
  if (!selectedExpense) {
    return;
  }

  const token = localStorage.getItem(
    "expensebuddy_access",
  );

    if (!token) {
      router.replace("/login");
      return;
    }
    const accessToken = token;

    async function loadReceipts() {
      try {
        const data = await apiFetch<Receipt[]>(
          `/api/receipts/expense/${selectedExpense}/`,
          { token: accessToken },
        );

        setReceipts(data);
      } catch (requestError) {
        const error = requestError as Error & {
          status?: number;
        };

        if (
          error.status === 401 ||
          error.status === 403
        ) {
          localStorage.removeItem(
            "expensebuddy_access",
          );
          localStorage.removeItem(
            "expensebuddy_refresh",
          );
          localStorage.removeItem(
            "expensebuddy_user",
          );

          router.replace("/login");
          return;
        }

        toast.error("Unable to load receipts.");
      }
    }

    loadReceipts();
  }, [selectedExpense, router]);

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !selectedExpense) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only PDF, JPG, and PNG files are allowed.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Receipt file size cannot exceed 5 MB.",
      );
      return;
    }

    const token = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("expense", selectedExpense);
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/receipts/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const contentType =
        response.headers.get("content-type");

      const data = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.file?.[0] ||
            "Unable to upload receipt.",
        );
      }

      setReceipts((current) => [
        data as Receipt,
        ...current,
      ]);

      toast.success("Receipt uploaded successfully.");
    } catch (requestError) {
      const error = requestError as Error & {
        status?: number;
      };

      toast.error(
        error.message || "Unable to upload receipt.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(receipt: Receipt) {
    const confirmed = window.confirm(
      `Delete "${receipt.original_filename}"?`,
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(receipt.id);

    try {
      await apiFetch<null>(
        `/api/receipts/${receipt.id}/`,
        {
          method: "DELETE",
          token,
        },
      );

      setReceipts((current) =>
        current.filter(
          (item) => item.id !== receipt.id,
        ),
      );

      toast.success("Receipt deleted.");
    } catch (requestError) {
      const error = requestError as Error & {
        status?: number;
      };

      if (
        error.status === 401 ||
        error.status === 403
      ) {
        localStorage.removeItem(
          "expensebuddy_access",
        );
        localStorage.removeItem(
          "expensebuddy_refresh",
        );
        localStorage.removeItem(
          "expensebuddy_user",
        );

        router.replace("/login");
        return;
      }

      toast.error(
        error.message || "Unable to delete receipt.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const selectedExpenseObject = expenses.find(
    (expense) => expense.id === selectedExpense,
  );

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto min-h-screen max-w-7xl px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ReceiptText className="h-5 w-5" />
            </div>

            <span className="text-xl font-bold tracking-tight text-gray-950">
              ExpenseBuddy
            </span>
          </Link>

          <Link
            href="/expenses"
            className="text-sm font-medium text-gray-600 hover:text-gray-950"
          >
            Expenses
          </Link>
        </header>

        <div className="mx-auto max-w-4xl py-10">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Receipts
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Upload receipts or take a picture and attach
              them to your expenses.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="expense"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Select expense
            </label>

            {loading ? (
              <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You need to create an expense before
                uploading a receipt.
              </div>
            ) : (
              <select
                id="expense"
                value={selectedExpense}
                onChange={(event) =>
                  setSelectedExpense(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {expenses.map((expense) => (
                  <option
                    key={expense.id}
                    value={expense.id}
                  >
                    {expense.expense_date} —{" "}
                    {expense.description ||
                      expense.category}{" "}
                    — ₹
                    {Number(
                      expenseTotal(expense),
                    ).toFixed(2)}
                  </option>
                ))}
              </select>
            )}

            {selectedExpenseObject && (
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Selected expense
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {selectedExpenseObject.description ||
                    selectedExpenseObject.category}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {selectedExpenseObject.expense_date}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  !selectedExpense || uploading
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}

                Upload Receipt
              </button>

              <button
                type="button"
                disabled={
                  !selectedExpense || uploading
                }
                onClick={() =>
                  cameraInputRef.current?.click()
                }
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
                Take Picture
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            <p className="mt-4 text-center text-xs text-gray-500">
              Supported formats: JPG, PNG, PDF · Maximum
              size: 5 MB
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">
                Uploaded receipts
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {receipts.length}{" "}
                {receipts.length === 1
                  ? "receipt"
                  : "receipts"}
              </span>
            </div>

            {receipts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No receipts uploaded yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Upload a receipt or take a picture above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {receipt.original_filename}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(
                            receipt.uploaded_at,
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={receipt.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        View
                      </a>

                      <button
                        type="button"
                        disabled={
                          deletingId === receipt.id
                        }
                        onClick={() =>
                          handleDelete(receipt)
                        }
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete receipt"
                      >
                        {deletingId === receipt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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

function expenseTotal(expense: Expense) {
  return (
    Number(expense.fare || 0) +
    Number(expense.stay || 0) +
    Number(expense.food || 0) +
    Number(expense.da || 0) +
    Number(expense.phone || 0) +
    Number(expense.mobile || 0) +
    Number(expense.postage || 0) +
    Number(expense.fax || 0) +
    Number(expense.email_expense || 0) +
    Number(expense.stationary || 0) +
    Number(expense.telegram || 0) +
    Number(expense.photo_copies || 0) +
    Number(expense.octroi || 0) +
    Number(expense.demurrage || 0) +
    Number(expense.collie_cartage || 0)
  );
}