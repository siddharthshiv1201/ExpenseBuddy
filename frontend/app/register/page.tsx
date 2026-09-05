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

interface RegisterResponse {
  email: string;
  profile: {
    first_name: string;
    last_name: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
    fax: "",
    designation: "",
    department: "",
    state: "",
    headquarters: "",
    reporting_to: "",
    joining_date: "",
    address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(
    field: keyof typeof form,
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

    setError("");
    setSuccess("");

    if (
      !form.email.trim() ||
      !form.password ||
      !form.first_name.trim() ||
      !form.last_name.trim()
    ) {
      setError(
        "Please complete all required fields.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must be at least 8 characters long.",
      );
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<RegisterResponse>(
        "/api/auth/register/",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            profile: {
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              phone: form.phone.trim(),
              fax: form.fax.trim(),
              designation: form.designation.trim(),
              department: form.department.trim(),
              state: form.state.trim(),
              headquarters: form.headquarters.trim(),
              reporting_to: form.reporting_to.trim(),
              joining_date:
                form.joining_date || null,
              address: form.address.trim(),
            },
          }),
        },
      );

      setSuccess(
        `Account created successfully for ${data.email}.`,
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      const apiError = error as Error & {
        status?: number;
        data?: Record<string, unknown>;
      };

      if (
        apiError.status === 400 &&
        apiError.data
      ) {
        const data = apiError.data;

        if (data.email) {
          setError(
            Array.isArray(data.email)
              ? String(data.email[0])
              : String(data.email),
          );
        } else if (data.password) {
          setError(
            Array.isArray(data.password)
              ? String(data.password[0])
              : String(data.password),
          );
        } else {
          setError(
            "Please check the information you entered.",
          );
        }
      } else {
        setError(
          "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-5xl px-6 py-6 lg:px-8">
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

        <div className="mx-auto max-w-3xl py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Set up your ExpenseBuddy account and profile.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
            <form
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {success}
                </div>
              )}

              {/* Account */}
              <section>
                <h2 className="text-base font-semibold text-gray-950">
                  Account details
                </h2>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Email address"
                    required
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateField("email", value)
                    }
                    placeholder="you@example.com"
                  />

                  <PasswordField
                    label="Password"
                    required
                    value={form.password}
                    show={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    onChange={(value) =>
                      updateField("password", value)
                    }
                    placeholder="Minimum 8 characters"
                  />

                  <PasswordField
                    label="Confirm password"
                    required
                    value={form.confirmPassword}
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(
                        (value) => !value,
                      )
                    }
                    onChange={(value) =>
                      updateField(
                        "confirmPassword",
                        value,
                      )
                    }
                    placeholder="Repeat your password"
                  />
                </div>
              </section>

              {/* Personal */}
              <section className="border-t border-gray-100 pt-7">
                <h2 className="text-base font-semibold text-gray-950">
                  Personal information
                </h2>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="First name"
                    required
                    value={form.first_name}
                    onChange={(value) =>
                      updateField(
                        "first_name",
                        value,
                      )
                    }
                    placeholder="First name"
                  />

                  <Field
                    label="Last name"
                    required
                    value={form.last_name}
                    onChange={(value) =>
                      updateField(
                        "last_name",
                        value,
                      )
                    }
                    placeholder="Last name"
                  />

                  <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(value) =>
                      updateField("phone", value)
                    }
                    placeholder="Phone number"
                  />

                  <Field
                    label="Fax"
                    value={form.fax}
                    onChange={(value) =>
                      updateField("fax", value)
                    }
                    placeholder="Fax number"
                  />

                  <Field
                    label="State"
                    value={form.state}
                    onChange={(value) =>
                      updateField("state", value)
                    }
                    placeholder="State"
                  />

                  <Field
                    label="Headquarters"
                    value={form.headquarters}
                    onChange={(value) =>
                      updateField(
                        "headquarters",
                        value,
                      )
                    }
                    placeholder="Headquarters"
                  />

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-medium text-gray-800"
                    >
                      Address
                    </label>

                    <textarea
                      id="address"
                      value={form.address}
                      onChange={(event) =>
                        updateField(
                          "address",
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Your address"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </section>

              {/* Work */}
              <section className="border-t border-gray-100 pt-7">
                <h2 className="text-base font-semibold text-gray-950">
                  Work information
                </h2>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Designation"
                    value={form.designation}
                    onChange={(value) =>
                      updateField(
                        "designation",
                        value,
                      )
                    }
                    placeholder="e.g. Software Engineer"
                  />

                  <Field
                    label="Department"
                    value={form.department}
                    onChange={(value) =>
                      updateField(
                        "department",
                        value,
                      )
                    }
                    placeholder="e.g. Finance"
                  />

                  <Field
                    label="Reporting to"
                    value={form.reporting_to}
                    onChange={(value) =>
                      updateField(
                        "reporting_to",
                        value,
                      )
                    }
                    placeholder="Manager name"
                  />

                  <Field
                    label="Joining date"
                    type="date"
                    value={form.joining_date}
                    onChange={(value) =>
                      updateField(
                        "joining_date",
                        value,
                      )
                    }
                  />
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign in
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
    </main>
  );
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function PasswordField({
  label,
  required,
  value,
  show,
  onToggle,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required={required}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}