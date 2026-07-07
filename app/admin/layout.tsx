import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSignOut } from "@/components/admin/sign-out";

// UI-level gate for a clean redirect experience. The REAL enforcement is
// requireAdmin() inside every /api/admin/* route + service call, per
// CLAUDE.md ("Admin checks server-side in services, never just hidden UI").
// This layout never substitutes for that — it just avoids flashing a
// dashboard shell at someone who's about to get 401/403'd anyway.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const navItems = [
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/users", label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-forest/15 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin/orders" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" className="h-6 w-6 object-contain" />
              <span className="font-serif text-lg font-bold tracking-[.02em] text-forest">
                QLOTHE <span className="font-sans text-xs font-bold uppercase tracking-[.14em] text-forest/50">Admin</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-forest/70 hover:bg-forest/5 hover:text-forest"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink/50 sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <Link href="/" className="text-sm font-semibold text-forest underline underline-offset-4">
              View storefront
            </Link>
            <AdminSignOut />
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-forest/10 px-5 py-1.5 md:hidden">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-forest/70 hover:bg-forest/5 hover:text-forest"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1280px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
