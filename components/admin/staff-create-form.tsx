"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "h-11 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm text-ink outline-none focus:border-forest";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50";

export function StaffCreateForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SUPPORT" | "MANAGER" | "ADMIN">("SUPPORT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), role }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(typeof body?.error === "string" ? body.error : "Could not create the account.");
        return;
      }
      setCreated({ email: body.email, tempPassword: body.tempPassword });
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="rounded-2xl border border-forest/15 bg-white p-6">
        <div className="mb-1 font-serif text-xl font-semibold text-forest">Account created</div>
        <p className="mb-4 text-sm text-ink/60">
          Share these credentials with {created.email} directly — this password is shown once and isn&apos;t
          stored anywhere. They&apos;ll be asked to set their own on first sign-in.
        </p>
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-forest/15 bg-paper p-4 font-mono text-sm">
          <div>
            <span className="text-ink/50">email:</span> {created.email}
          </div>
          <div>
            <span className="text-ink/50">temp password:</span> {created.tempPassword}
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/users")}
          className="h-11 rounded-full bg-forest px-6 text-sm font-bold text-white hover:bg-pine"
        >
          Back to users
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={inputClass}>
              <option value="SUPPORT">Support</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/45">
          A temporary password is generated automatically and shown once after creation. The account is required
          to set its own password on first sign-in.
        </p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-forest px-8 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
