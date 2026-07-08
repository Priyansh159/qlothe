import { db } from "@/lib/db";
import type { Prisma, PrismaClient } from "@prisma/client";

// Accepts either the top-level db singleton or a $transaction callback's tx
// client, so a mutation + its audit row can commit atomically when that
// matters (e.g. order status change + stock restore + audit, all-or-nothing).
type DbOrTx = PrismaClient | Prisma.TransactionClient;

export async function writeAudit(
  client: DbOrTx,
  entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  await client.adminAuditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before === undefined ? undefined : (entry.before as Prisma.InputJsonValue),
      after: entry.after === undefined ? undefined : (entry.after as Prisma.InputJsonValue),
    },
  });
}

export async function listAuditLog(params: { page: number; perPage: number }) {
  const { page, perPage } = params;
  const [items, total] = await Promise.all([
    db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.adminAuditLog.count(),
  ]);

  // Display-only actor lookup — audit rows intentionally have no FK to User
  // (see the model comment in schema.prisma), so we batch-resolve names here
  // rather than joining.
  const actorIds = Array.from(new Set(items.map((i) => i.actorId)));
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, email: true, name: true },
  });
  const actorById = new Map(actors.map((a) => [a.id, a]));

  return {
    items: items.map((i) => ({ ...i, actor: actorById.get(i.actorId) ?? null })),
    total,
    page,
    pages: Math.ceil(total / perPage),
  };
}

export async function recentAuditEntries(limit: number) {
  const items = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const actorIds = Array.from(new Set(items.map((i) => i.actorId)));
  const actors = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, email: true, name: true },
  });
  const actorById = new Map(actors.map((a) => [a.id, a]));
  return items.map((i) => ({ ...i, actor: actorById.get(i.actorId) ?? null }));
}
