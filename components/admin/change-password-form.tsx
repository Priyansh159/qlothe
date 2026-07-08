"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not update the password.");
        return;
      }
      // role/mustChangePassword are baked into the JWT at sign-in only, so a
      // fresh sign-in is what actually clears the forced-change state.
      await signOut({ callbackUrl: "/login?next=/admin&changed=1" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[420px] flex-col justify-center px-5 py-14">
      <h1 className="mb-2 font-serif text-2xl font-semibold text-forest">
        {forced ? "Set a new password" : "Change password"}
      </h1>
      <p className="mb-7 text-sm text-ink/60">
        {forced
          ? "This account was created with a temporary password. Set your own before continuing."
          : "Choose a new password for your account."}
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            className="h-11 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        {error ? <div className="text-sm font-semibold text-red-700">{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-12 rounded-full bg-forest text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save and sign in again"}
        </button>
      </form>
    </div>
  );
}
