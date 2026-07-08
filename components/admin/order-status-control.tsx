"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusControl({
  orderId,
  allowed,
}: {
  orderId: string;
  allowed: OrderStatus[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (allowed.length === 0) {
    return <p className="text-sm text-ink/50">No transitions available to your role for this order.</p>;
  }

  const needsAwb = target === "SHIPPED";

  const submit = async () => {
    if (!target) return;
    if (needsAwb && (!awbNumber.trim() || !courier.trim())) {
      setError("AWB number and courier are required to mark this order as shipped.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: target,
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(needsAwb ? { awbNumber: awbNumber.trim(), courier: courier.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not update status");
        return;
      }
      setTarget("");
      setNote("");
      setAwbNumber("");
      setCourier("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <button
            key={s}
            onClick={() => setTarget(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] ${
              target === s ? "border-forest bg-forest text-white" : "border-forest/25 text-forest hover:bg-forest/5"
            }`}
          >
            → {s.replace("_", " ")}
          </button>
        ))}
      </div>
      {target ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-forest/15 bg-paper p-3.5">
          {needsAwb ? (
            <>
              <input
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="Courier (e.g. Delhivery, Bluedart)"
                className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
              />
              <input
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="AWB / tracking number"
                className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
              />
            </>
          ) : null}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
          {error ? <div className="text-xs font-semibold text-red-700">{error}</div> : null}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="h-9 rounded-full bg-forest px-4 text-xs font-bold uppercase tracking-[.04em] text-white hover:bg-pine disabled:opacity-60"
            >
              {busy ? "Updating…" : `Confirm move to ${target.replace("_", " ")}`}
            </button>
            <button
              onClick={() => setTarget("")}
              className="h-9 rounded-full px-4 text-xs font-bold uppercase tracking-[.04em] text-ink/50 hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
