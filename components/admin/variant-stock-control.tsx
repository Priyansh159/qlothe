"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type StockVariantRow = { id: string; sku: string; size: string; color: string; stock: number };

/**
 * Deliberately separate from the bulk product-edit form: this is the
 * "requires a reason string; audited" correction path (services/admin.ts
 * adjustVariantStock), meant for stocktake corrections on an EXISTING
 * variant — not for setting initial stock while building a new product,
 * which the product form still handles directly.
 */
export function VariantStockControl({ variants }: { variants: StockVariantRow[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [stock, setStock] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (v: StockVariantRow) => {
    setOpenId(v.id);
    setStock(String(v.stock));
    setReason("");
    setError(null);
  };

  const submit = async (variantId: string) => {
    const n = Number(stock);
    if (!Number.isInteger(n) || n < 0) {
      setError("Stock must be a whole number ≥ 0.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required — e.g. \"stocktake correction\" or \"damaged units\".");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: n, reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not update stock");
        return;
      }
      setOpenId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {variants.map((v) => (
        <div key={v.id} className="rounded-xl border border-forest/10 bg-paper p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="font-semibold">{v.color} / {v.size}</span>{" "}
              <span className="text-ink/50">{v.sku}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className={`font-bold ${v.stock === 0 ? "text-red-700" : "text-forest"}`}>{v.stock}</span>
              <button
                type="button"
                onClick={() => open(v)}
                className="rounded-full border border-forest/25 px-3 py-1 text-xs font-bold text-forest hover:bg-forest/5"
              >
                Adjust
              </button>
            </div>
          </div>
          {openId === v.id ? (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required) — e.g. stocktake correction"
                className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
              />
              {error ? <div className="text-xs font-semibold text-red-700">{error}</div> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => submit(v.id)}
                  disabled={busy}
                  className="h-9 rounded-full bg-forest px-4 text-xs font-bold uppercase tracking-[.04em] text-white hover:bg-pine disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="h-9 rounded-full px-4 text-xs font-bold uppercase tracking-[.04em] text-ink/50 hover:bg-ink/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
