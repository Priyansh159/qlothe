"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CouponType } from "@prisma/client";

export type CouponFormInitial = {
  id: string;
  code: string;
  type: CouponType;
  valueDisplay: string; // rupees for FLAT, raw percent for PERCENT
  minOrderRupees: string;
  maxUses: string;
  expiresAt: string; // yyyy-mm-dd
  isActive: boolean;
};

const inputClass =
  "h-11 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm text-ink outline-none focus:border-forest";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50";

export function CouponForm({ initial }: { initial: CouponFormInitial | null }) {
  const router = useRouter();
  const editing = initial !== null;

  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<CouponType>(initial?.type ?? "PERCENT");
  const [value, setValue] = useState(initial?.valueDisplay ?? "");
  const [minOrderRupees, setMinOrderRupees] = useState(initial?.minOrderRupees ?? "0");
  const [maxUses, setMaxUses] = useState(initial?.maxUses ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valueNum = Number(value);
    if (!Number.isFinite(valueNum) || valueNum <= 0) {
      setError("Value must be greater than 0.");
      return;
    }
    if (type === "PERCENT" && valueNum > 100) {
      setError("A PERCENT coupon's value must be between 1 and 100.");
      return;
    }

    const body: Record<string, unknown> = {
      type,
      value: type === "PERCENT" ? Math.round(valueNum) : Math.round(valueNum * 100), // FLAT is paise
      minOrder: Math.round((Number(minOrderRupees) || 0) * 100),
      maxUses: maxUses.trim() ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive,
    };
    if (!editing) body.code = code.trim();

    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/admin/coupons/${initial!.id}` : "/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(typeof err?.error === "string" ? err.error : "Could not save the coupon — check the fields above.");
        return;
      }
      router.push("/admin/coupons");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Code {editing ? <span className="normal-case text-ink/35">(fixed after creation)</span> : null}
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={editing}
              required
              placeholder="LAUNCH10"
              className={`${inputClass} disabled:bg-paper disabled:text-ink/50`}
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className={inputClass}>
              <option value="PERCENT">Percent off</option>
              <option value="FLAT">Flat amount off (₹)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Value {type === "PERCENT" ? "(%)" : "(₹)"}</label>
            <input
              type="number"
              min="1"
              max={type === "PERCENT" ? 100 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={type === "PERCENT" ? "10" : "100"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minimum order (₹)</label>
            <input
              type="number"
              min="0"
              value={minOrderRupees}
              onChange={(e) => setMinOrderRupees(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max uses (blank = unlimited)</label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expires (blank = never)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink md:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Active
          </label>
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-forest px-8 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
