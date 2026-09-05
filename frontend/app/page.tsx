import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: ReceiptText,
    title: "Track expenses",
    description:
      "Keep your travel and daily expenses organized in one place.",
  },
  {
    icon: BarChart3,
    title: "Understand spending",
    description:
      "See clear summaries and monthly insights without digging through spreadsheets.",
  },
  {
    icon: ShieldCheck,
    title: "Keep receipts together",
    description:
      "Attach receipts directly to expenses and access them whenever you need them.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <ReceiptText className="h-5 w-5" />
          </div>

          <span className="text-xl font-bold tracking-tight text-gray-950">
            ExpenseBuddy
          </span>
        </div>

        <Link
          href="/login"
          className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Sign in
        </Link>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Simple expense management
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-950 sm:text-6xl">
            Manage your expenses
            <span className="block text-blue-600">without the spreadsheet headache.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            ExpenseBuddy helps you record expenses, attach receipts, and
            understand your monthly spending from one clean workspace.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#features"
              className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              Explore features
            </a>
          </div>
        </div>

        <div
          id="features"
          className="mx-auto mt-20 grid max-w-5xl gap-5 md:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="text-base font-semibold text-gray-950">
                  {feature.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-gray-500 lg:px-8">
          ExpenseBuddy · Expense management made simple
        </div>
      </footer>
    </main>
  );
}