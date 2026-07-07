import Link from "next/link";
import { listUsersAdmin } from "@/services/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users · Admin" };

export default async function AdminUsersPage() {
  const users = await listUsersAdmin();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-forest">Users</h1>
        <p className="mt-1 text-sm text-ink/55">
          {users.length} {users.length === 1 ? "account" : "accounts"}
        </p>
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
            {users.map((u) => (
              <tr key={u.id} className="border-b border-forest/10 last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3 font-semibold">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${
                      u.role === "ADMIN" ? "bg-forest/10 text-forest" : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {u.role}
                  </span>
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
    </div>
  );
}
