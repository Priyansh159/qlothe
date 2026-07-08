"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { roleAtLeast } from "@/lib/role-hierarchy";

const NAV: { href: string; label: string; minRole: Role }[] = [
  { href: "/admin", label: "Dashboard", minRole: "SUPPORT" },
  { href: "/admin/orders", label: "Orders", minRole: "SUPPORT" },
  { href: "/admin/products", label: "Products", minRole: "MANAGER" },
  { href: "/admin/coupons", label: "Coupons", minRole: "MANAGER" },
  { href: "/admin/users", label: "Users", minRole: "ADMIN" },
  { href: "/admin/audit", label: "Audit", minRole: "ADMIN" },
];

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => roleAtLeast(role, n.minRole));

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
      {items.map((n) => {
        const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active ? "bg-forest text-white" : "text-forest/70 hover:bg-forest/5 hover:text-forest"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
