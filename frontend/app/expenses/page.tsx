"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  Menu,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { apiFetch } from "@/lib/api/client";
import type { Expense } from "@/types/expense";

const categories: {
  value: Expense["category"];
  label: string;
}[] = [
  { value: "TRAVEL", label: "Travel" },
  { value: "MEALS", label: "Meals" },
  {
    value: "ACCOMMODATION",
    label: "Accommodation",
  },
  { value: "OFFICE", label: "Office" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
];

const categoryLabels: Record<
  Expense["category"],
  string
> = {
  TRAVEL: "Travel",
  MEALS: "Meals",
  ACCOMMODATION: "Accommodation",
  OFFICE: "Office",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

const emptyForm = {
  expense_date: "",
  category: "TRAVEL" as Expense["category"],
  from_location: "",
  to_location: "",
  distance_km: "",
  mode_of_conveyance: "",
  departure_time: "",
  arrival_time: "",
  fare: "0",
  stay: "0",
  food: "0",
  da: "0",

  phone: "0",
  mobile: "0",
  postage: "0",
  fax: "0",
  email_expense: "0",
  stationary: "0",
  telegram: "0",
  photo_copies: "0",
  octroi: "0",
  demurrage: "0",
  collie_cartage: "0",


  description: "",
  remarks: "",
};

type ExpenseForm = typeof emptyForm;

function amount(value: string | null | undefined) {
  return Number(value || 0);
}

function expenseTotal(expense: Expense) {
  return (
    amount(expense.fare) +
    amount(expense.stay) +
    amount(expense.food) +
    amount(expense.da) +
    amount(expense.phone) +
    amount(expense.mobile) +
    amount(expense.postage) +
    amount(expense.fax) +
    amount(expense.email_expense) +
    amount(expense.stationary) +
    amount(expense.telegram) +
    amount(expense.photo_copies) +
    amount(expense.octroi) +
    amount(expense.demurrage) +
    amount(expense.collie_cartage)
  );
}

function formTotal(form: ExpenseForm) {
  return (
    amount(form.fare) +
    amount(form.stay) +
    amount(form.food) +
    amount(form.da) +
    amount(form.phone) +
    amount(form.mobile) +
    amount(form.postage) +
    amount(form.fax) +
    amount(form.email_expense) +
    amount(form.stationary) +
    amount(form.telegram) +
    amount(form.photo_copies) +
    amount(form.octroi) +
    amount(form.demurrage) +
    amount(form.collie_cartage)
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(firstName: string, lastName: string) {
  return (
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`
      .toUpperCase() || "U"
  );
}

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<Expense["category"] | "">("");
  const [monthFilter, setMonthFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [form, setForm] =
    useState<ExpenseForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const token = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadExpenses() {
      try {
        const data = await apiFetch<Expense[]>(
          "/api/expenses/",
          { token: token as string },
        );

        setExpenses(data);
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
          "Unable to load your expenses.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [router]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.description
          ?.toLowerCase()
          .includes(query) ||
        expense.remarks
          ?.toLowerCase()
          .includes(query) ||
        expense.from_location
          ?.toLowerCase()
          .includes(query) ||
        expense.to_location
          ?.toLowerCase()
          .includes(query) ||
        expense.mode_of_conveyance
          ?.toLowerCase()
          .includes(query) ||
        categoryLabels[expense.category]
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !categoryFilter ||
        expense.category === categoryFilter;

      const matchesMonth =
        !monthFilter ||
        expense.expense_date.startsWith(
          monthFilter,
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMonth
      );
    });
  }, [
    expenses,
    search,
    categoryFilter,
    monthFilter,
  ]);

  const statistics = useMemo(() => {
    const total = filteredExpenses.reduce(
      (sum, expense) =>
        sum + expenseTotal(expense),
      0,
    );

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;

    const monthExpenses = expenses.filter(
      (expense) =>
        expense.expense_date.startsWith(
          monthPrefix,
        ),
    );

    const monthTotal = monthExpenses.reduce(
      (sum, expense) =>
        sum + expenseTotal(expense),
      0,
    );

    return {
      total,
      monthTotal,
      count: filteredExpenses.length,
      allCount: expenses.length,
    };
  }, [expenses, filteredExpenses]);

  function openCreateModal() {
    setEditingExpense(null);

    setForm({
      ...emptyForm,
      expense_date: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setModalOpen(true);
  }

function openEditModal(expense: Expense) {
  setEditingExpense(expense);

  setForm({
    expense_date: expense.expense_date || "",
    category: expense.category,
    from_location: expense.from_location || "",
    to_location: expense.to_location || "",
    distance_km: expense.distance_km ?? "",
    mode_of_conveyance: expense.mode_of_conveyance || "",
    departure_time: expense.departure_time || "",
    arrival_time: expense.arrival_time || "",

    fare: expense.fare || "0",
    stay: expense.stay || "0",
    food: expense.food || "0",
    da: expense.da || "0",

    phone: expense.phone || "0",
    mobile: expense.mobile || "0",
    postage: expense.postage || "0",
    fax: expense.fax || "0",
    email_expense: expense.email_expense || "0",
    stationary: expense.stationary || "0",
    telegram: expense.telegram || "0",
    photo_copies: expense.photo_copies || "0",
    octroi: expense.octroi || "0",
    demurrage: expense.demurrage || "0",
    collie_cartage: expense.collie_cartage || "0",

    description: expense.description || "",
    remarks: expense.remarks || "",
  });

  setModalOpen(true);
}

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingExpense(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof ExpenseForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.expense_date) {
      toast.error("Please select an expense date.");
      return;
    }

    if (!form.category) {
      toast.error("Please select a category.");
      return;
    }

    const token = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    const payload = {
      expense_date: form.expense_date,
      category: form.category,
      from_location: form.from_location,
      to_location: form.to_location,
      distance_km: form.distance_km || null,
      mode_of_conveyance:
        form.mode_of_conveyance,
      departure_time:
        form.departure_time || null,
      arrival_time: form.arrival_time || null,
      fare: form.fare || "0",
      stay: form.stay || "0",
      food: form.food || "0",
      da: form.da || "0",
     phone: form.phone || "0",
mobile: form.mobile || "0",
postage: form.postage || "0",
fax: form.fax || "0",
email_expense: form.email_expense || "0",
stationary: form.stationary || "0",
telegram: form.telegram || "0",
photo_copies: form.photo_copies || "0",
octroi: form.octroi || "0",
demurrage: form.demurrage || "0",
collie_cartage: form.collie_cartage || "0",
    };

    try {
      if (editingExpense) {
        const updated = await apiFetch<Expense>(
          `/api/expenses/${editingExpense.id}/`,
          {
            method: "PATCH",
            token,
            body: JSON.stringify(payload),
          },
        );

        setExpenses((current) =>
          current.map((expense) =>
            expense.id === updated.id
              ? updated
              : expense,
          ),
        );

        toast.success(
          "Expense updated successfully.",
        );
      } else {
        const created = await apiFetch<Expense>(
          "/api/expenses/",
          {
            method: "POST",
            token,
            body: JSON.stringify(payload),
          },
        );

        setExpenses((current) => [
          created,
          ...current,
        ]);

        toast.success(
          "Expense added successfully.",
        );
      }

      closeModal();
    } catch (requestError) {
      const error = requestError as Error & {
        status?: number;
        data?: unknown;
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
        error.message ||
          "Unable to save the expense.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      `Delete this ${categoryLabels[
        expense.category
      ].toLowerCase()} expense? This action cannot be undone.`,
    );

    if (!confirmed) return;

    const token = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(expense.id);

    try {
      await apiFetch<null>(
        `/api/expenses/${expense.id}/`,
        {
          method: "DELETE",
          token,
        },
      );

      setExpenses((current) =>
        current.filter(
          (item) => item.id !== expense.id,
        ),
      );

      toast.success(
        "Expense deleted successfully.",
      );
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
        "Unable to delete the expense.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const storedUser =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "expensebuddy_user",
        )
      : null;

  let userName = "Account";
  let initials = "U";

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      userName =
        `${user.profile?.first_name || ""} ${
          user.profile?.last_name || ""
        }`.trim() || "Account";

      initials = getInitials(
        user.profile?.first_name || "",
        user.profile?.last_name || "",
      );
    } catch {
      // Use fallback values.
    }
  }

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="min-h-screen bg-[#f7f8fc] text-gray-950">
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <div className="text-lg font-bold tracking-tight">
                  ExpenseBuddy
                </div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Expense management
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </p>

            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              >
                <Wallet className="h-[18px] w-[18px]" />
                Dashboard
              </Link>

              <Link
                href="/expenses"
                className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-medium text-blue-700"
              >
                <ReceiptText className="h-[18px] w-[18px]" />
                Expenses
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
              </Link>

              <Link
                href="/receipts"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              >
                <ReceiptText className="h-[18px] w-[18px]" />
                Receipts
              </Link>

              <Link
                href="/reports"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              >
                <CircleDollarSign className="h-[18px] w-[18px]" />
                Reports
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              >
                <Wallet className="h-[18px] w-[18px]" />
                Profile
              </Link>
            </div>
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {userName}
                </p>

                <p className="text-xs text-gray-500">
                  Expense account
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-5 backdrop-blur sm:px-8">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-500">
                Expense management workspace
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {userName}
                </p>

                <p className="text-xs text-gray-500">
                  Expense account
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-blue-600">
                  Expense management
                </p>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Expenses
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Create, review and manage your
                  expense records.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add expense
              </button>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Filtered total"
                value={formatCurrency(
                  statistics.total,
                )}
                description={`${statistics.count} visible ${
                  statistics.count === 1
                    ? "record"
                    : "records"
                }`}
                icon={CircleDollarSign}
              />

              <StatCard
                title="This month"
                value={formatCurrency(
                  statistics.monthTotal,
                )}
                description="All records this month"
                icon={CalendarDays}
              />

              <StatCard
                title="Total records"
                value={statistics.allCount.toLocaleString(
                  "en-IN",
                )}
                description="All-time expenses"
                icon={Wallet}
              />
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-950">
                      Expense records
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Search and filter your expenses.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search expenses..."
                        className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-64"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={categoryFilter}
                        onChange={(event) =>
                          setCategoryFilter(
                            event.target
                              .value as
                              | Expense["category"]
                              | "",
                          )
                        }
                        className="h-10 w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-44"
                      >
                        <option value="">
                          All categories
                        </option>

                        {categories.map(
                          (category) => (
                            <option
                              key={
                                category.value
                              }
                              value={
                                category.value
                              }
                            >
                              {category.label}
                            </option>
                          ),
                        )}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="relative">
                      <input
                        type="month"
                        value={monthFilter}
                        onChange={(event) =>
                          setMonthFilter(
                            event.target.value,
                          )
                        }
                        className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-44"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-16 animate-pulse rounded-xl bg-gray-100"
                      />
                    ),
                  )}
                </div>
              ) : filteredExpenses.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <ReceiptText className="h-6 w-6 text-gray-500" />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900">
                    No expenses found
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    {expenses.length === 0
                      ? "You haven't added any expenses yet."
                      : "Try changing your search or filters."}
                  </p>

                  {expenses.length ===
                    0 && (
                    <button
                      type="button"
                      onClick={
                        openCreateModal
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add expense
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                          <th className="px-6 py-3">
                            Date
                          </th>

                          <th className="px-6 py-3">
                            Category
                          </th>

                          <th className="px-6 py-3">
                            Route
                          </th>

                          <th className="px-6 py-3">
                            Conveyance
                          </th>

                          <th className="px-6 py-3 text-right">
                            Amount
                          </th>

                          <th className="px-6 py-3 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredExpenses.map(
                          (expense) => (
                            <tr
                              key={
                                expense.id
                              }
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                            >
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                {formatDate(
                                  expense.expense_date,
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {
                                    categoryLabels[
                                      expense
                                        .category
                                    ]
                                  }
                                </span>
                              </td>

                              <td className="max-w-[240px] px-6 py-4 text-sm text-gray-700">
                                <div className="truncate">
                                  {expense.from_location ||
                                    "—"}
                                  {expense.to_location
                                    ? ` → ${expense.to_location}`
                                    : ""}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {expense.mode_of_conveyance ||
                                  "—"}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-950">
                                {formatCurrency(
                                  expenseTotal(
                                    expense,
                                  ),
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        expense,
                                      )
                                    }
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                                    aria-label="Edit expense"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        expense,
                                      )
                                    }
                                    disabled={
                                      deletingId ===
                                      expense.id
                                    }
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    aria-label="Delete expense"
                                  >
                                    {deletingId ===
                                    expense.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-100 md:hidden">
                    {filteredExpenses.map(
                      (expense) => (
                        <div
                          key={expense.id}
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {
                                  categoryLabels[
                                    expense.category
                                  ]
                                }
                              </span>

                              <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                                {expense.description ||
                                  expense.from_location ||
                                  "Expense"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {formatDate(
                                  expense.expense_date,
                                )}
                              </p>
                            </div>

                            <p className="whitespace-nowrap text-sm font-bold text-gray-950">
                              {formatCurrency(
                                expenseTotal(
                                  expense,
                                ),
                              )}
                            </p>
                          </div>

                          {(expense.from_location ||
                            expense.to_location ||
                            expense.mode_of_conveyance) && (
                            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                              {expense.from_location ||
                                "—"}
                              {expense.to_location
                                ? ` → ${expense.to_location}`
                                : ""}

                              {expense.mode_of_conveyance && (
                                <span className="ml-2 text-gray-400">
                                  •{" "}
                                  {
                                    expense.mode_of_conveyance
                                  }
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  expense,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  expense,
                                )
                              }
                              disabled={
                                deletingId ===
                                expense.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}

              {!loading &&
                filteredExpenses.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-xs text-gray-500 sm:px-6">
                    <span>
                      Showing{" "}
                      <strong className="font-semibold text-gray-800">
                        {filteredExpenses.length}
                      </strong>{" "}
                      of{" "}
                      <strong className="font-semibold text-gray-800">
                        {expenses.length}
                      </strong>{" "}
                      records
                    </span>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-300"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-300"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </main>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="expense-modal-title"
                  className="text-lg font-bold text-gray-950"
                >
                  {editingExpense
                    ? "Edit expense"
                    : "Add expense"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Enter the details for this expense
                  record.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto"
            >
              <div className="space-y-8 p-5 sm:p-6">
                <FormSection title="Basic details">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Expense date"
                      required
                    >
                      <input
                        type="date"
                        value={form.expense_date}
                        onChange={(event) =>
                          updateForm(
                            "expense_date",
                            event.target.value,
                          )
                        }
                        required
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label="Category"
                      required
                    >
                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateForm(
                            "category",
                            event.target
                              .value,
                          )
                        }
                        required
                        className={inputClass}
                      >
                        {categories.map(
                          (category) => (
                            <option
                              key={
                                category.value
                              }
                              value={
                                category.value
                              }
                            >
                              {category.label}
                            </option>
                          ),
                        )}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="Description">
                      <input
                        type="text"
                        value={form.description}
                        onChange={(event) =>
                          updateForm(
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Client visit to Mumbai"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Travel details">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="From location">
                      <input
                        type="text"
                        value={form.from_location}
                        onChange={(event) =>
                          updateForm(
                            "from_location",
                            event.target.value,
                          )
                        }
                        placeholder="Departure location"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="To location">
                      <input
                        type="text"
                        value={form.to_location}
                        onChange={(event) =>
                          updateForm(
                            "to_location",
                            event.target.value,
                          )
                        }
                        placeholder="Destination"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Distance (km)">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.distance_km}
                        onChange={(event) =>
                          updateForm(
                            "distance_km",
                            event.target.value,
                          )
                        }
                        placeholder="0.00"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Mode of conveyance">
                      <input
                        type="text"
                        value={
                          form.mode_of_conveyance
                        }
                        onChange={(event) =>
                          updateForm(
                            "mode_of_conveyance",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Flight, Train, Taxi"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Departure time">
                      <input
                        type="time"
                        value={
                          form.departure_time
                        }
                        onChange={(event) =>
                          updateForm(
                            "departure_time",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Arrival time">
                      <input
                        type="time"
                        value={form.arrival_time}
                        onChange={(event) =>
                          updateForm(
                            "arrival_time",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Expense amounts">
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <AmountField
                      label="Fare"
                      value={form.fare}
                      onChange={(value) =>
                        updateForm(
                          "fare",
                          value,
                        )
                      }
                    />

                    <AmountField
                      label="Stay"
                      value={form.stay}
                      onChange={(value) =>
                        updateForm(
                          "stay",
                          value,
                        )
                      }
                    />

                    <AmountField
                      label="Food"
                      value={form.food}
                      onChange={(value) =>
                        updateForm(
                          "food",
                          value,
                        )
                      }
                    />
                                        <AmountField
                      label="DA"
                      value={form.da}
                      onChange={(value) =>
                        updateForm(
                          "da",
                          value,
                        )
                      }
                    />

                    <AmountField
  label="Phone"
  value={form.phone}
  onChange={(value) =>
    updateForm("phone", value)
  }
/>

<AmountField
  label="Mobile"
  value={form.mobile}
  onChange={(value) =>
    updateForm("mobile", value)
  }
/>

<AmountField
  label="Postage"
  value={form.postage}
  onChange={(value) =>
    updateForm("postage", value)
  }
/>

<AmountField
  label="Fax"
  value={form.fax}
  onChange={(value) =>
    updateForm("fax", value)
  }
/>

<AmountField
  label="Email"
  value={form.email_expense}
  onChange={(value) =>
    updateForm("email_expense", value)
  }
/>

<AmountField
  label="Stationary"
  value={form.stationary}
  onChange={(value) =>
    updateForm("stationary", value)
  }
/>

<AmountField
  label="Telegram"
  value={form.telegram}
  onChange={(value) =>
    updateForm("telegram", value)
  }
/>

<AmountField
  label="Photo Copies"
  value={form.photo_copies}
  onChange={(value) =>
    updateForm("photo_copies", value)
  }
/>

<AmountField
  label="Octroi"
  value={form.octroi}
  onChange={(value) =>
    updateForm("octroi", value)
  }
/>

<AmountField
  label="Demurrage"
  value={form.demurrage}
  onChange={(value) =>
    updateForm("demurrage", value)
  }
/>

<AmountField
  label="Collie / Cartage"
  value={form.collie_cartage}
  onChange={(value) =>
    updateForm("collie_cartage", value)
  }
/>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-4">
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        Total expense
                      </p>

                      <p className="mt-0.5 text-xs text-blue-600/70">
  Fare + Stay + Food + DA + Phone + Mobile + Postage +
  Fax + Email + Stationary + Telegram + Photo Copies +
  Octroi + Demurrage + Collie / Cartage
</p>
                    </div>

                    <p className="text-xl font-bold text-blue-800">
                      {formatCurrency(
                        formTotal(form),
                      )}
                    </p>
                  </div>
                </FormSection>

                <FormSection title="Additional information">
                  <Field label="Remarks">
                    <textarea
                      value={form.remarks}
                      onChange={(event) =>
                        updateForm(
                          "remarks",
                          event.target.value,
                        )
                      }
                      rows={4}
                      placeholder="Add any additional notes..."
                      className={`${inputClass} h-auto py-3`}
                    />
                  </Field>
                </FormSection>

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <p className="text-xs leading-5 text-amber-800">
                    Please verify the amounts and
                    expense date before saving. The
                    expense will be stored in your
                    account.
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingExpense
                      ? "Save changes"
                      : "Add expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        {title}
      </h3>

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`${inputClass} pl-8`}
        />
      </div>
    </Field>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}