"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ReceiptText,
  UserCircle,
  Wallet,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import type { User } from "@/types/auth";
import type { Expense } from "@/types/expense";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Wallet,
  },
  {
    label: "Receipts",
    href: "/receipts",
    icon: Receipt,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserCircle,
  },
];

const categoryLabels: Record<Expense["category"], string> = {
  TRAVEL: "Travel",
  MEALS: "Meals",
  ACCOMMODATION: "Accommodation",
  OFFICE: "Office",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

function getExpenseTotal(expense: Expense) {
  return [
    expense.fare,
    expense.stay,
    expense.food,
    expense.da,
    expense.phone,
    expense.mobile,
    expense.postage,
    expense.fax,
    expense.email_expense,
    expense.stationary,
    expense.telegram,
    expense.photo_copies,
    expense.octroi,
    expense.demurrage,
    expense.collie_cartage,
  ].reduce(
    (total, value) => total + Number(value || 0),
    0,
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(user: User | null) {
  if (!user?.profile) {
    return "U";
  }

  const first = user.profile.first_name?.[0] ?? "";
  const last = user.profile.last_name?.[0] ?? "";

  return `${first}${last}`.toUpperCase() || "U";
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem(
      "expensebuddy_access",
    );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    
    const token = accessToken;
    async function loadDashboard() {
  try {
    const [me, expenseData] = await Promise.all([
      apiFetch<User>("/api/auth/me/", {
        token,
      }),
      apiFetch<Expense[]>("/api/expenses/", {
        token,
      }),
    ]);

        setUser(me);
        setExpenses(expenseData);

        localStorage.setItem(
          "expensebuddy_user",
          JSON.stringify(me),
        );
      } catch (requestError) {
        const apiError = requestError as Error & {
          status?: number;
        };

        if (
          apiError.status === 401 ||
          apiError.status === 403
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

        setError(
          "Unable to load your dashboard. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const statistics = useMemo(() => {
    const now = new Date();

    const currentMonthExpenses = expenses.filter(
      (expense) => {
        const date = new Date(expense.expense_date);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      },
    );

    const total = expenses.reduce(
      (sum, expense) =>
        sum + getExpenseTotal(expense),
      0,
    );

    const currentMonthTotal =
      currentMonthExpenses.reduce(
        (sum, expense) =>
          sum + getExpenseTotal(expense),
        0,
      );

    return {
      total,
      currentMonthTotal,
      count: expenses.length,
      currentMonthCount:
        currentMonthExpenses.length,
    };
  }, [expenses]);

  function handleLogout() {
    localStorage.removeItem("expensebuddy_access");
    localStorage.removeItem("expensebuddy_refresh");
    localStorage.removeItem("expensebuddy_user");

    router.replace("/login");
  }

  const firstName =
    user?.profile?.first_name || "there";

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-950">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
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
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 rounded-xl bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {getInitials(user)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user?.profile
                    ? `${user.profile.first_name} ${user.profile.last_name}`
                    : "Loading..."}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
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

          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-50"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {user?.profile?.first_name ||
                  "Account"}
              </p>

              <p className="text-xs text-gray-500">
                {user?.profile?.designation ||
                  "Expense manager"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {getInitials(user)}
            </div>
          </Link>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">
                Overview
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Good to see you, {firstName}.
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Here&apos;s what your expense activity looks like.
                like.
              </p>
            </div>

            <Link
              href="/expenses"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Wallet className="h-4 w-4" />
              Add expense
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total expenses"
              value={
                loading
                  ? "—"
                  : formatCurrency(statistics.total)
              }
              description={`${statistics.count} recorded ${
                statistics.count === 1
                  ? "expense"
                  : "expenses"
              }`}
              icon={CircleDollarSign}
            />

            <StatCard
              title="This month"
              value={
                loading
                  ? "—"
                  : formatCurrency(
                      statistics.currentMonthTotal,
                    )
              }
              description={`${statistics.currentMonthCount} ${
                statistics.currentMonthCount === 1
                  ? "expense"
                  : "expenses"
              } this month`}
              icon={CalendarDays}
            />

            <StatCard
              title="Expense records"
              value={
                loading
                  ? "—"
                  : statistics.count.toLocaleString(
                      "en-IN",
                    )
              }
              description="All-time records"
              icon={FileText}
            />
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold text-gray-950">
                  Recent expenses
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Your latest expense activity
                </p>
              </div>

              <Link
                href="/expenses"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <Receipt className="h-6 w-6 text-gray-500" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  No expenses yet
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                  Add your first expense to start
                  tracking your spending.
                </p>

                <Link
                  href="/expenses"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add your first expense
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-3">
                        Date
                      </th>
                      <th className="px-6 py-3">
                        Category
                      </th>
                      <th className="px-6 py-3">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses
                      .slice(0, 8)
                      .map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
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
                                  expense.category
                                ]
                              }
                            </span>
                          </td>

                          <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-700">
                            {expense.description ||
                              `${expense.from_location || "—"} → ${
                                expense.to_location ||
                                "—"
                              }`}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-950">
                            {formatCurrency(
                              getExpenseTotal(
                                expense,
                              ),
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  Keep your expenses organized
                </p>

                <p className="mt-1 text-sm text-blue-800/70">
                  Add receipts and maintain accurate
                  expense records.
                </p>
              </div>

              <Link
                href="/receipts"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
              >
                Manage receipts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
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