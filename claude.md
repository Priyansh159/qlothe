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
Schema, services (products, cart, checkout, payments, orders, admin), and
API routes exist. lib/auth.ts runs NextAuth v5 (credentials + Google, JWT
sessions, trustHost). Frontend is split into two route groups under app/:
(storefront) — home, listing, detail, cart, checkout with Razorpay+COD,
orders, auth, wrapped in its own layout (marquee/header/footer/cart drawer);
admin — /admin/{orders,products,users}, gated by session.user.role==="ADMIN"
in app/admin/layout.tsx (UI-only redirect; every mutation is still enforced
server-side via requireAdmin() in the API route, per the rule below). Client
state in components/store-provider. Design reference: "QLOTHE Storefront.html"
mockup. First admin is bootstrapped locally via `npm run admin:seed`
(scripts/seed-admin.ts) — deliberately not an HTTP endpoint.