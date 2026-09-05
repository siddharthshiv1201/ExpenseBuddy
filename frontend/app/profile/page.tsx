"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

import { apiFetch } from "@/lib/api/client";

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  fax: string;
  designation: string;
  department: string;
  state: string;
  headquarters: string;
  reporting_to: string;
  joining_date: string | null;
  profile_photo: string | null;
  address: string;
}

interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: Profile;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Profile>({
    first_name: "",
    last_name: "",
    phone: "",
    fax: "",
    designation: "",
    department: "",
    state: "",
    headquarters: "",
    reporting_to: "",
    joining_date: null,
    profile_photo: null,
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("expensebuddy_access");

      if (!token) {
        setError("Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<User>("/api/auth/me/", {
          token,
        });

        setUser(data);
        setForm({
          first_name: data.profile?.first_name ?? "",
          last_name: data.profile?.last_name ?? "",
          phone: data.profile?.phone ?? "",
          fax: data.profile?.fax ?? "",
          designation: data.profile?.designation ?? "",
          department: data.profile?.department ?? "",
          state: data.profile?.state ?? "",
          headquarters: data.profile?.headquarters ?? "",
          reporting_to: data.profile?.reporting_to ?? "",
          joining_date: data.profile?.joining_date ?? null,
          profile_photo: data.profile?.profile_photo ?? null,
          address: data.profile?.address ?? "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("expensebuddy_access");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedUser = await apiFetch<User>(
        "/api/auth/me/",
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            profile: {
              first_name: form.first_name,
              last_name: form.last_name,
              phone: form.phone,
              fax: form.fax,
              designation: form.designation,
              department: form.department,
              state: form.state,
              headquarters: form.headquarters,
              reporting_to: form.reporting_to,
              joining_date: form.joining_date || null,
              profile_photo: form.profile_photo,
              address: form.address,
            },
          }),
        },
      );

      setUser(updatedUser);

      setForm({
        first_name: updatedUser.profile?.first_name ?? "",
        last_name: updatedUser.profile?.last_name ?? "",
        phone: updatedUser.profile?.phone ?? "",
        fax: updatedUser.profile?.fax ?? "",
        designation: updatedUser.profile?.designation ?? "",
        department: updatedUser.profile?.department ?? "",
        state: updatedUser.profile?.state ?? "",
        headquarters: updatedUser.profile?.headquarters ?? "",
        reporting_to: updatedUser.profile?.reporting_to ?? "",
        joining_date:
          updatedUser.profile?.joining_date ?? null,
        profile_photo:
          updatedUser.profile?.profile_photo ?? null,
        address: updatedUser.profile?.address ?? "",
      });

      localStorage.setItem(
        "expensebuddy_user",
        JSON.stringify(updatedUser),
      );

      toast.success("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Toaster richColors />

        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-600">
                Loading profile...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error && !user) {
    return (
      <>
        <Toaster richColors />

        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-lg font-semibold text-red-800">
                Profile
              </h1>

              <p className="mt-2 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster richColors />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              ExpenseBuddy
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Profile
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              View and update your personal and work information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Personal information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  label="First name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Last name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Email"
                  name="email"
                  value={user?.email ?? ""}
                  readOnly
                />

                <Field
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <Field
                  label="Fax"
                  name="fax"
                  value={form.fax}
                  onChange={handleChange}
                />

                <Field
                  label="Joining date"
                  name="joining_date"
                  type="date"
                  value={form.joining_date ?? ""}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Work information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                />

                <Field
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                />

                <Field
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />

                <Field
                  label="Headquarters"
                  name="headquarters"
                  value={form.headquarters}
                  onChange={handleChange}
                />

                <Field
                  label="Reporting to"
                  name="reporting_to"
                  value={form.reporting_to}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Address
              </h2>

              <div className="mt-5">
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

function Field({
  label,
  name,
  value,
  type = "text",
  readOnly = false,
  required = false,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        className={`w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition ${
          readOnly
            ? "cursor-not-allowed bg-slate-100 text-slate-500"
            : "bg-white text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        }`}
      />
    </div>
  );
}
