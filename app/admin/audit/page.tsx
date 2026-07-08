import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { listAuditLog } from "@/services/audit";

export const dynamic = "force-dynamic";

export const metadata = { title: "Audit log · Admin" };

const PER_PAGE = 40;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireRole("ADMIN");
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { items, total, pages } = await listAuditLog({ page, perPage: PER_PAGE });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-forest">Audit log</h1>
        <p className="mt-1 text-sm text-ink/55">
          {total} {total === 1 ? "entry" : "entries"} · append-only, every admin mutation recorded
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/15 bg-white">
        {items.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink/50">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-forest/10 bg-paper text-xs font-bold uppercase tracking-[.04em] text-ink/50">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-forest/10 align-top last:border-0 hover:bg-paper/60">
                    <td className="whitespace-nowrap px-4 py-3 text-ink/45">
                      {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{a.actor?.email ?? a.actorId}</td>
                    <td className="px-4 py-3 font-semibold text-forest">{a.action}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {a.entityType} <span className="text-ink/35">{a.entityId.slice(0, 8)}</span>
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-xs text-ink/50">
                      {a.after ? (
                        <pre className="whitespace-pre-wrap break-words font-mono">
                          {JSON.stringify(a.after, null, 0)}
                        </pre>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/audit?page=${p}`}
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
