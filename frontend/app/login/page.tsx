"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ReceiptText,
} from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import type { LoginResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>(
        "/api/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      localStorage.setItem(
        "expensebuddy_access",
        data.access,
      );

      localStorage.setItem(
        "expensebuddy_refresh",
        data.refresh,
      );

      localStorage.setItem(
        "expensebuddy_user",
        JSON.stringify(data.user),
      );

      router.push("/dashboard");
    } catch (error) {
      const apiError = error as Error & {
        status?: number;
      };

      if (apiError.status === 401) {
        setError("Invalid email or password.");
      } else if (apiError.status === 403) {
        setError("This account is inactive.");
      } else if (apiError.status === 400) {
        setError(
          "Please enter your email and password.",
        );
      } else {
        setError(
          "Unable to connect to ExpenseBuddy. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ReceiptText className="h-5 w-5" />
            </div>

            <span className="text-xl font-bold tracking-tight text-gray-950">
              ExpenseBuddy
            </span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Sign in to continue to your ExpenseBuddy
                account.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-800"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-800"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Create one
                </Link>
              </div>
            </div>

            <Link
              href="/"
              className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm text-gray-500 transition hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}