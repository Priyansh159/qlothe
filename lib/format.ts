// Client-safe display helpers. Money is ALWAYS integer paise in data;
// these convert to rupees for display only.

export function inr(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: hasPaise ? 2 : 0,
    })
  );
}

// GST is included in prices (5% slab for apparel ≤ ₹1000). Display only —
// the server computes the authoritative figure at order time.
export function gstIncluded(totalPaise: number): number {
  return Math.round(totalPaise - totalPaise / 1.05);
}

// Mirrors services/checkout.ts shipping rules for display. Server reprices.
export const FREE_SHIPPING_ABOVE = 99900;
export const SHIPPING_FEE = 4900;
export const COD_FEE = 5000;

export function shippingFor(subtotalMinusDiscount: number, cod: boolean): number {
  if (subtotalMinusDiscount >= FREE_SHIPPING_ABOVE) return 0;
  return SHIPPING_FEE + (cod ? COD_FEE : 0);
}
