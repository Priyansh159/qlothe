# Qlothe — e-commerce t-shirt brand (Indian D2C market)

## Stack
Next.js 14+ App Router + TypeScript on Vercel · Prisma + Neon Postgres ·
Razorpay · Cloudinary · Tailwind. No other libraries without asking.

## Architecture rules (non-negotiable)
- Thin routes, fat services: app/api/* files only parse → Zod-validate →
  call a function in services/. ALL business logic lives in services/,
  framework-free (it moves to Express in a later phase untouched).
- Money is ALWAYS integer paise. Never floats, never rupee decimals.
- Snapshots: order_items copies productName/variantLabel/sku/unitPrice at
  purchase; orders store shippingAddress as JSON. Never re-join products
  for historical orders.
- Stock changes ONLY via atomic updateMany({ where: { stock: { gte: qty }}})
  inside a transaction. Never read-then-write stock.
- Order state machine: PENDING → PAID → CONFIRMED → SHIPPED → DELIVERED
  (+ COD_PENDING, CANCELLED, REFUNDED). Every transition appends to
  order_status_history. No skipping states.
- The Razorpay webhook is the ONLY thing that marks orders PAID. It is
  HMAC-verified over the RAW body and idempotent via unique
  razorpay_payment_id. Client callbacks are display-only.
- Every API input validated with Zod from lib/validation.ts. Never spread
  req body into queries.
- Secrets: only RAZORPAY_KEY_ID may be NEXT_PUBLIC_. Everything else
  server-only.
- Auth goes through lib/auth.ts ONLY (single choke point). Admin checks
  server-side in services, never just hidden UI.
- Ownership: user-scoped queries always include userId in the WHERE.

## Conventions
- Prisma client via lib/db.ts singleton only.
- Errors in services: throw Error with a .status property; routes map it.
- DB fields snake_case via @map, TypeScript camelCase.
- After schema changes: npx prisma migrate dev, never db push on main.
- Run npx tsc --noEmit before declaring any task done.

## Current state
Schema, services (products, cart, checkout, payments, orders, admin, audit,
auth), and API routes exist. lib/auth.ts runs NextAuth v5 (credentials +
Google, JWT sessions, trustHost). Frontend is split into two route groups
under app/: (storefront) — home, listing, detail, cart, checkout with
Razorpay (currently commented out client-side — COD only until re-enabled,
see components/checkout-client.tsx) + COD, orders, auth, wrapped in its own
layout (marquee/header/footer/cart drawer); admin — full staff console at
/admin/{dashboard,orders,products,coupons,users,audit}.

Roles: CUSTOMER < SUPPORT < MANAGER < ADMIN (prisma Role enum + lib/role-hierarchy.ts
roleAtLeast). lib/rbac.ts's requireRole(minRole) is the route/page gate (throws
401/403); every services/admin.ts function additionally calls assertRole()
itself as the real, server-side backstop per the rule below — routes/pages are
UI convenience only. app/admin/layout.tsx gates the whole tree at SUPPORT and
hides nav items below each role's level; it also blocks all admin content
behind a forced ChangePasswordForm when session.user.mustChangePassword is
true (set on staff accounts created via POST /api/admin/users until they set
their own password — see services/auth.ts changeOwnPassword, which signs the
user out since role/mustChangePassword are only re-read at sign-in).

Order state machine unchanged (services/checkout.ts createOrder and the
webhook route are untouched); services/admin.ts updateOrderStatus adds:
SUPPORT may only move an order to SHIPPED/DELIVERED (SHIPPED requires
Order.awbNumber + courier, both nullable columns), everything else
(CONFIRMED/CANCELLED/REFUNDED) needs MANAGER+; cancelling/refunding any order
that hasn't shipped restores stock in the same transaction (mirrors, but
doesn't share code with, the checkout.ts release pattern — that file was
off-limits). Every mutating admin function writes an AdminAuditLog row
(services/audit.ts) — append-only, no update/delete exposed.

First ADMIN is bootstrapped locally via `npm run admin:seed`
(scripts/seed-admin.ts) — deliberately not an HTTP endpoint; every other
staff account is created through the admin UI itself (ADMIN-only).