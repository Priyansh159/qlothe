"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Role } from "@prisma/client";

export type CartItem = {
  id: string;
  variantId: string;
  name: string;
  slug: string;
  image: string | null;
  label: string; // "Black / M"
  unitPrice: number; // paise
  quantity: number;
  lineTotal: number; // paise
  available: boolean;
};

export type Cart = { id: string; items: CartItem[]; subtotal: number };

export type StoreUser = { id: string; name: string | null; email: string | null; role: Role } | null;

type Toast = { id: number; msg: string; type: "success" | "error" };

type StoreContextValue = {
  cloudName: string | null;
  razorpayKeyId: string | null;
  user: StoreUser;
  cart: Cart | null;
  cartCount: number;
  cartBusy: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity: number, name: string) => Promise<boolean>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toasts: Toast[];
  notify: (msg: string, type?: "success" | "error") => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function StoreProvider({
  cloudName,
  razorpayKeyId,
  user,
  children,
}: {
  cloudName: string | null;
  razorpayKeyId: string | null;
  user: StoreUser;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) setCart(await res.json());
    } catch {
      // network hiccup — keep whatever we had
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity: number, name: string) => {
      setCartBusy(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          notify(typeof body?.error === "string" ? body.error : "Could not add to bag", "error");
          return false;
        }
        setCart(await res.json());
        setDrawerOpen(true);
        notify(`${name} added to bag`);
        return true;
      } finally {
        setCartBusy(false);
      }
    },
    [notify],
  );

  const setQuantity = useCallback(async (variantId: string, quantity: number) => {
    setCartBusy(true);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      if (res.ok) setCart(await res.json());
    } finally {
      setCartBusy(false);
    }
  }, []);

  const removeItem = useCallback(
    async (variantId: string) => {
      await setQuantity(variantId, 0);
      notify("Removed from bag", "error");
    },
    [setQuantity, notify],
  );

  const cartCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <StoreContext.Provider
      value={{
        cloudName,
        razorpayKeyId,
        user,
        cart,
        cartCount,
        cartBusy,
        refreshCart,
        addToCart,
        setQuantity,
        removeItem,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        toasts,
        notify,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
