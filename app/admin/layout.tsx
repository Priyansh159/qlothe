import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleAtLeast } from "@/lib/role-hierarchy";
import { AdminSignOut } from "@/components/admin/sign-out";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

// UI-level gate for a clean redirect experience. The REAL enforcement is
// requireRole() inside every /api/admin/* route AND (per CLAUDE.md) inside
// every services/admin.ts function itself via assertRole() — this layout
// never substitutes for that, it just avoids flashing a dashboard shell at
// someone who's about to get 401/403'd anyway, and hides nav items the
// current role can't use (also cosmetic — the routes enforce independently).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");
  if (!roleAtLeast(session.user.role, "SUPPORT")) redirect("/");

  const { role, mustChangePassword } = session.user;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-forest/15 bg-white">
        <div className="flex h-16 items-center justify-between px-5 md:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="h-6 w-6 object-contain" />
            <span className="font-serif text-lg font-bold tracking-[.02em] text-forest">
              QLOTHE{" "}
              <span className="font-sans text-xs font-bold uppercase tracking-[.14em] text-forest/50">
                Admin
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink/50 sm:inline">
              {session.user.name ?? session.user.email}
              <span className="ml-2 rounded-full bg-forest/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] text-forest">
                {role}
              </span>
            </span>
            <Link href="/" className="text-sm font-semibold text-forest underline underline-offset-4">
              View storefront
            </Link>
            <AdminSignOut />
          </div>
        </div>
        {mustChangePassword ? null : (
          <div className="px-5 pb-2 md:hidden">
            <AdminSidebar role={role} />
          </div>
        )}
      </header>

      {mustChangePassword ? (
        // Blocks the entire admin area — including whatever `children` the
        // route tree resolved — until the temp password is replaced. No URL
        // redirect involved (avoids a redirect loop with this same layout),
        // the shell just renders the form instead of the page.
        <ChangePasswordForm forced />
      ) : (
        <div className="mx-auto flex max-w-[1280px] gap-6 px-5 py-6 md:px-8">
          <aside className="hidden w-[200px] flex-none md:block">
            <AdminSidebar role={role} />
          </aside>
          <main className="min-w-0 flex-1 py-2">{children}</main>
        </div>
      )}
    </div>
  );
}
