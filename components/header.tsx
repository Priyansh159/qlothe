"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useStore } from "@/components/store-provider";
import { CATEGORIES } from "@/lib/catalog";

function SearchIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="1.9">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function Header() {
  const router = useRouter();
  const { user, cartCount, openDrawer } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [query, setQuery] = useState("");
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acctOpen) return;
    const onDown = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [acctOpen]);

  const go = (href: string) => {
    setMenuOpen(false);
    setAcctOpen(false);
    router.push(href);
  };

  const submitSearch = () => {
    go(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : "/products");
  };

  const navItems = [
    { label: "New & Featured", href: "/products?sort=new" },
    ...CATEGORIES.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })),
    { label: "Sale", href: "/products" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-forest/15 bg-white">
        {/* utility bar (desktop) */}
        <div className="hidden h-[38px] items-center justify-end border-b border-forest/10 bg-paper px-12 md:flex">
          <div className="flex items-center gap-3.5">
            <Link href="/#story" className="text-xs font-semibold text-forest hover:opacity-60">
              Help
            </Link>
            <span className="text-[11px] text-forest/30">|</span>
            <Link href="/orders" className="text-xs font-semibold text-forest hover:opacity-60">
              Track Order
            </Link>
            <span className="text-[11px] text-forest/30">|</span>
            {user ? (
              <span className="text-xs font-bold text-forest">{user.name ?? user.email}</span>
            ) : (
              <Link href="/login" className="text-xs font-bold text-forest hover:opacity-60">
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* main row */}
        <div className="relative mx-auto flex h-[58px] w-full max-w-[1200px] items-center justify-between px-4 md:grid md:h-[66px] md:grid-cols-[1fr_auto_1fr] md:gap-6 md:px-12">
          {/* left: hamburger (mobile) / logo */}
          <div className="flex items-center justify-self-start">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              className="-ml-2.5 flex h-11 w-11 flex-col items-center justify-center gap-1 md:hidden"
            >
              <span className="h-0.5 w-[19px] rounded bg-forest" />
              <span className="h-0.5 w-[19px] rounded bg-forest" />
              <span className="h-0.5 w-[13px] rounded bg-forest" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="block h-[26px] w-auto" />
              <span className="font-serif text-[21px] font-bold tracking-[.02em] text-forest">
                QLOTHE
              </span>
            </Link>
          </div>

          {/* center: nav (desktop) */}
          <nav className="hidden items-center gap-[34px] justify-self-center md:flex">
            <Link
              href="/products?sort=new"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-forest hover:opacity-60"
            >
              New &amp; Featured
            </Link>
            <div className="group relative">
              <Link
                href="/products"
                className="flex items-center gap-1 whitespace-nowrap py-2 text-[15px] font-bold text-forest hover:opacity-60"
              >
                Men&apos;s <span className="text-[10px]">▾</span>
              </Link>
              <div className="absolute left-1/2 top-full z-40 hidden -translate-x-1/2 pt-3.5 group-hover:block">
                <div className="flex min-w-[190px] flex-col gap-0.5 rounded-[14px] border border-forest/15 bg-white p-2 shadow-[0_14px_34px_rgba(6,64,43,.14)]">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      className="whitespace-nowrap rounded-[9px] px-3.5 py-[11px] text-left text-sm font-semibold text-forest hover:bg-forest/5"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/products"
              className="whitespace-nowrap py-2 text-[15px] font-bold text-forest hover:opacity-60"
            >
              Sale
            </Link>
          </nav>

          {/* right: search + icons */}
          <div className="relative flex items-center gap-2.5 justify-self-end md:[grid-column:3]">
            <div className="hidden h-11 min-w-[200px] cursor-text items-center gap-2 rounded-full bg-forest/5 px-4 lg:flex">
              <SearchIcon />
              <input
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                className="w-full border-none bg-transparent text-sm text-ink outline-none"
              />
            </div>
            <button
              onClick={submitSearch}
              aria-label="Search"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-forest/5 lg:hidden"
            >
              <SearchIcon size={19} />
            </button>
            <Link
              href="/orders"
              aria-label="My orders"
              className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-forest/5 md:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="1.7">
                <path d="M12 20s-7-4.4-9.2-8.5C1.3 8.8 2.6 5.5 5.8 5.5c1.9 0 3.2 1.2 4.2 2.6 1-1.4 2.3-2.6 4.2-2.6 3.2 0 4.5 3.3 3 6-2.2 4.1-9.2 8.5-9.2 8.5z" />
              </svg>
            </Link>
            <button
              onClick={openDrawer}
              aria-label="Cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-forest/5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="1.7">
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-px -top-px flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-forest px-[5px] text-[10.5px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
            {user ? (
              <div ref={acctRef} className="hidden md:block">
                <button
                  onClick={() => setAcctOpen((v) => !v)}
                  aria-label="Account"
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-forest/5"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="1.7">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.5-3.8 4.5-5.5 8-5.5s6.5 1.7 8 5.5" />
                  </svg>
                </button>
                {acctOpen ? (
                  <div className="absolute right-0 top-[54px] z-40 w-[220px] animate-qslideup rounded-2xl border border-forest/15 bg-paper p-2 shadow-[0_10px_30px_rgba(6,64,43,.1)]">
                    <div className="px-3 pb-2 pt-2.5 text-xs text-ink/50">Signed in as</div>
                    <div className="truncate px-3 pb-2.5 text-sm font-semibold">{user.email}</div>
                    <div className="mx-1.5 mb-1.5 h-px bg-forest/10" />
                    <button
                      onClick={() => go("/orders")}
                      className="w-full rounded-[10px] px-3 py-2.5 text-left text-sm font-medium text-forest hover:bg-forest/5"
                    >
                      My orders
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full rounded-[10px] px-3 py-2.5 text-left text-sm font-medium text-forest hover:bg-forest/5"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* mobile menu sheet */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 animate-qfade bg-forest/35" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 animate-qsheet rounded-t-3xl bg-white px-[22px] pb-[30px] pt-3">
            <div className="mx-auto mb-[18px] h-[5px] w-11 rounded-full bg-forest/20" />
            <div className="flex flex-col">
              {navItems.map((n) => (
                <button
                  key={n.label}
                  onClick={() => go(n.href)}
                  className="flex items-center justify-between border-b border-forest/10 py-[18px] font-serif text-[22px] font-semibold text-forest"
                >
                  {n.label}
                  <span className="text-lg">→</span>
                </button>
              ))}
            </div>
            <div className="mt-[22px] flex gap-2.5">
              {user ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="h-[50px] flex-1 rounded-full border-[1.5px] border-forest text-[14.5px] font-bold text-forest"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => go("/login")}
                  className="h-[50px] flex-1 rounded-full border-[1.5px] border-forest text-[14.5px] font-bold text-forest"
                >
                  Sign in
                </button>
              )}
              <button
                onClick={() => go("/cart")}
                className="h-[50px] flex-1 rounded-full bg-forest text-[14.5px] font-bold text-white"
              >
                Bag · {cartCount}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
