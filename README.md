# Qlothe — schema + API starter

The Phase 0 backbone: Prisma schema, service layer, and API routes.
Drop these folders into a fresh `create-next-app` (App Router + TS) project.

## Setup

```bash
npm install   # package.json already lists next/react/prisma/next-auth/etc.
cp .env.example .env   # fill in Neon + Razorpay + Google + Cloudinary + Upstash values
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Add to `schema.prisma` datasource if using Neon pooling:
`directUrl = env("DIRECT_URL")`

## Layout

| Path | Role |
|---|---|
| `prisma/schema.prisma` | 13 models, money in integer paise |
| `lib/` | db singleton · razorpay + HMAC verify · auth stub · Zod schemas |
| `services/` | ALL business logic (framework-free → moves to Express in Phase 2 untouched) |
| `app/api/` | thin routes: parse → validate → call service |

## The three invariants (already implemented)

1. **Snapshots**: `order_items` copies name/label/sku/price; address stored as JSON on the order.
2. **Atomic stock**: `updateMany({ where: { stock: { gte: qty } } })` inside the checkout transaction — count 0 = out of stock, rollback.
3. **Webhook = truth**: HMAC-verified, idempotent via UNIQUE `razorpay_payment_id`; only PENDING→PAID allowed; amount cross-checked.

## Wired but needs your keys

- Razorpay webhook: dashboard → Webhooks → `https://<domain>/api/webhooks/razorpay`, event `payment.captured` (+ `payment.failed`), set the secret in env.
- Vercel Cron (`vercel.json`) hits `/api/cron/release-stock` every 15 min to cancel stale PENDING orders and restore stock. Set `CRON_SECRET`.
- UptimeRobot → `/api/health` (also keeps Neon warm).

## Auth, admin routes, uploads, and rate limiting (done)

- `lib/auth.ts` — Auth.js v5, Credentials (bcrypt) + Google, Prisma adapter, JWT sessions.
  Merges the guest cart into the user's cart on login (`services/cart.ts#mergeGuestCart`).
- `app/api/auth/register` — Zod-validated signup, 409 on duplicate email.
- `app/api/admin/*` — product create/update (variants + images) and order list/status
  update, all behind `requireAdmin`; transitions validated in `services/admin.ts`.
  Admins can never set `PAID` directly — only the Razorpay webhook does that.
- `app/api/admin/uploads/sign` — Cloudinary signed upload; the API secret never
  leaves the server.
- `@upstash/ratelimit` on register/login/checkout — fails OPEN (no limiting) if
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset, so local dev needs no Upstash account.

## Deliberately NOT here yet (next steps, in order)

1. Email service (Resend) — call after payment captured.
2. Frontend pages / admin UI.
