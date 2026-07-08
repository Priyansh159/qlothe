import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { listUsersAdmin } from "@/services/admin";
import { adminUserQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users · Admin" };

const ROLES = Object.values(Role);

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const actor = await requireRole("ADMIN");
  const parsed = adminUserQuerySchema.safeParse(searchParams);
  const query = parsed.success ? parsed.data : adminUserQuerySchema.parse({});
  const { items, total, page, pages } = await listUsersAdmin(actor, query);

  const hrefFor = (over: Partial<{ role: string; page: number }>) => {
    const next = new URLSearchParams();
    if (query.search) next.set("search", query.search);
    const role = over.role !== undefined ? over.role : query.role;
    if (role) next.set("role", role);
    next.set("page", String(over.page ?? 1));
    return `/admin/users?${next.toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest">Users</h1>
          <p className="mt-1 text-sm text-ink/55">
            {total} {total === 1 ? "account" : "accounts"}
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          + New staff account
        </Link>
      </div>

      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-forest/15 bg-white p-4">
        {query.role ? <input type="hidden" name="role" value={query.role} /> : null}
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">
            Search by name or email
          </label>
          <input
            type="text"
            name="search"
            defaultValue={query.search ?? ""}
            className="h-10 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        <button type="submit" className="h-10 rounded-full bg-forest px-5 text-sm font-bold text-white hover:bg-pine">
          Search
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href={hrefFor({ role: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] ${
            !query.role ? "border-forest bg-forest text-white" : "border-forest/20 text-forest hover:bg-forest/5"
          }`}
        >
          All roles
        </Link>
        {ROLES.map((r) => (
          <Link
            key={r}
            href={hrefFor({ role: r })}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] ${
              query.role === r ? "border-forest bg-forest text-white" : "border-forest/20 text-forest hover:bg-forest/5"
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-forest/10 bg-paper text-xs font-bold uppercase tracking-[.04em] text-ink/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b border-forest/10 last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/users/${u.id}`} className="text-forest hover:underline">
                    {u.name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${
                      u.role === "CUSTOMER" ? "bg-ink/10 text-ink/50" : "bg-forest/10 text-forest"
                    }`}
                  >
                    {u.role}
                  </span>
                  {u.mustChangePassword ? (
                    <span className="ml-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      Temp pw
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  {u._count.orders > 0 ? (
                    <Link href={`/admin/orders?userId=${u.id}`} className="font-semibold text-forest underline underline-offset-4">
                      {u._count.orders}
                    </Link>
                  ) : (
                    <span className="text-ink/40">0</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/45">
                  {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={hrefFor({ page: p })}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                p === page ? "bg-forest text-white" : "border border-forest/20 text-forest hover:bg-forest/5"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
