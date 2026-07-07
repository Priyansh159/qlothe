// Loads Razorpay's checkout.js on demand and opens the payment modal.
// The client callback is DISPLAY-ONLY: the webhook is the sole source of
// truth for marking orders PAID (see app/api/webhooks/razorpay).

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Razorpay"));
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

export async function openRazorpay(opts: {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // paise
  orderNumber: string;
  name?: string;
  contact?: string;
  onDismiss: () => void;
  onPaymentSubmitted: () => void;
}): Promise<void> {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay unavailable");
  const rzp = new window.Razorpay({
    key: opts.keyId,
    order_id: opts.razorpayOrderId,
    amount: opts.amount,
    currency: "INR",
    name: "QLOTHE",
    description: `Order ${opts.orderNumber}`,
    prefill: { name: opts.name ?? "", contact: opts.contact ?? "" },
    theme: { color: "#06402B" },
    handler: () => opts.onPaymentSubmitted(),
    modal: { ondismiss: () => opts.onDismiss() },
  });
  rzp.open();
}
