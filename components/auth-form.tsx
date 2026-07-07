"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useStore } from "@/components/store-provider";

const inputClass =
  "h-12 w-full rounded-xl border-[1.5px] border-forest/20 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-forest";
const labelClass = "mb-[7px] block text-[12.5px] font-semibold text-ink/60";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const { notify, refreshCart } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    if (res?.error) {
      setError(
        res.code === "rate_limited"
          ? "Too many attempts — wait a minute and try again."
          : "Wrong email or password.",
      );
      return false;
    }
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mirrors lib/validation.ts registerSchema — display-only; the server re-validates.
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "register" && password.length > 72) {
      setError("Password must be at most 72 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            ...(name.trim() ? { name: name.trim() } : {}),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(typeof body?.error === "string" ? body.error : "Could not create the account.");
          return;
        }
        notify("Account created — welcome to the press");
      }
      const ok = await doLogin(cleanEmail, password);
      if (ok) {
        await refreshCart(); // guest cart may have been merged on login
        router.push(next);
        router.refresh(); // re-render server layout with the session user
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[420px] animate-qfade flex-col justify-center px-5 py-14">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-forest/50">
        / Account
      </div>
      <h1 className="mb-2 font-serif text-[34px] font-semibold uppercase leading-none tracking-[.005em] text-forest">
        {mode === "login" ? "Sign in" : "Join the press"}
      </h1>
      <p className="mb-7 text-sm text-ink/60">
        {mode === "login"
          ? "Welcome back. Your bag is right where you left it."
          : "One account for orders, tracking and faster checkout."}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {mode === "register" ? (
          <div>
            <label className={labelClass}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Arjun Mehta"
              autoComplete="name"
              className={inputClass}
            />
          </div>
        ) : null}
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.in"
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "8+ characters" : "••••••••"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className={inputClass}
          />
        </div>

        {error ? <div className="text-[13px] font-semibold text-forest">{error}</div> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-[52px] w-full rounded-full bg-forest text-[15px] font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-forest/15" />
        or
        <span className="h-px flex-1 bg-forest/15" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: next })}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-forest/25 text-[14.5px] font-bold text-forest hover:bg-forest/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1l-3.9 3C3.2 21.2 7.3 24 12 24z" />
          <path fill="#FBBC05" d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3l-3.9-3C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z" />
          <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.8 1.2 6.7l3.9 3c.9-3 3.7-5 6.9-5z" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-ink/60">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="font-bold text-forest underline underline-offset-[3px]"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already with us?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="font-bold text-forest underline underline-offset-[3px]"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
