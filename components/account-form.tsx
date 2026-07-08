"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/store-provider";

export type ProfileInitial = {
  id: string;
  email: string;
  pendingEmail: string | null;
  name: string | null;
  phone: string | null;
  hasPassword: boolean;
};

const inputClass =
  "h-11 w-full rounded-lg border border-forest/20 bg-white px-3.5 text-sm text-ink outline-none focus:border-forest";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50";
const sectionClass = "rounded-2xl border border-forest/15 bg-white p-6";
const titleClass = "mb-4 font-serif text-lg font-semibold text-forest";

export function AccountForm({ initial }: { initial: ProfileInitial }) {
  const { notify } = useStore();
  const params = useSearchParams();

  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [pendingEmail, setPendingEmail] = useState(initial.pendingEmail);
  const [newEmail, setNewEmail] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(initial.hasPassword);

  const emailChanged = params.get("emailChanged");
  const emailChangeError = params.get("emailChangeError");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setProfileError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setProfileError(typeof body?.error === "string" ? body.error : "Could not save your details.");
        return;
      }
      notify("Details updated");
    } finally {
      setSavingProfile(false);
    }
  };

  const requestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setSendingEmail(true);
    try {
      const res = await fetch("/api/account/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setEmailError(typeof body?.error === "string" ? body.error : "Could not send the confirmation email.");
        return;
      }
      setPendingEmail(newEmail.trim());
      setNewEmail("");
      notify("Check your inbox to confirm the new email");
    } finally {
      setSendingEmail(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(hasPassword ? { currentPassword } : {}),
          newPassword,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordError(typeof body?.error === "string" ? body.error : "Could not update your password.");
        return;
      }
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password updated");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {emailChanged ? (
        <div className="rounded-xl bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          Your email is now {emailChanged}.
        </div>
      ) : null}
      {emailChangeError ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{emailChangeError}</div>
      ) : null}

      <form onSubmit={saveProfile} className={sectionClass}>
        <div className={titleClass}>Your details</div>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mobile (10-digit)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink/50">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                placeholder="98XXXXXXXX"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          {profileError ? <div className="text-sm font-semibold text-red-700">{profileError}</div> : null}
          <button
            type="submit"
            disabled={savingProfile}
            className="h-11 self-start rounded-full bg-forest px-6 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <div className={sectionClass}>
        <div className={titleClass}>Email</div>
        <p className="mb-3 text-sm text-ink/70">
          Current: <span className="font-semibold">{initial.email}</span>
        </p>
        {pendingEmail ? (
          <p className="mb-4 text-sm text-forest">
            A confirmation link was sent to <span className="font-semibold">{pendingEmail}</span> — click it to
            finish the change.
          </p>
        ) : null}
        <form onSubmit={requestEmailChange} className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>New email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@newaddress.com"
              className={inputClass}
              required
            />
          </div>
          {emailError ? <div className="text-sm font-semibold text-red-700">{emailError}</div> : null}
          <button
            type="submit"
            disabled={sendingEmail}
            className="h-11 self-start rounded-full border-[1.5px] border-forest px-6 text-sm font-bold text-forest hover:bg-forest/5 disabled:opacity-60"
          >
            {sendingEmail ? "Sending…" : "Send verification link"}
          </button>
        </form>
      </div>

      <form onSubmit={savePassword} className={sectionClass}>
        <div className={titleClass}>{hasPassword ? "Change password" : "Set a password"}</div>
        {!hasPassword ? (
          <p className="mb-3 text-sm text-ink/60">
            Your account currently only signs in via Google. Set a password to also sign in with email.
          </p>
        ) : null}
        <div className="flex flex-col gap-4">
          {hasPassword ? (
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : null}
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8+ characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {passwordError ? <div className="text-sm font-semibold text-red-700">{passwordError}</div> : null}
          <button
            type="submit"
            disabled={savingPassword}
            className="h-11 self-start rounded-full bg-forest px-6 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
          >
            {savingPassword ? "Saving…" : hasPassword ? "Update password" : "Set password"}
          </button>
        </div>
      </form>
    </div>
  );
}
