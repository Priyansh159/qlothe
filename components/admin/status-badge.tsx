const COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  COD_PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-forest/10 text-forest",
  CONFIRMED: "bg-forest/10 text-forest",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${
        COLORS[status] ?? "bg-ink/10 text-ink"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
