// Deliberately a local script, not an API route: granting ADMIN must never be
// reachable over HTTP (see CLAUDE.md — "Admin checks server-side in services,
// never just hidden UI"). Run with: npm run admin:seed
//
// Behavior:
//   - Email doesn't exist yet  -> creates it as ADMIN with a generated password
//     (printed once; nothing is stored in plaintext).
//   - Email already exists     -> promotes it to ADMIN and leaves the password
//     untouched (bcrypt hashes can't be reversed, so there is nothing to print).
//
// Override any field: ADMIN_EMAIL=you@x.com ADMIN_NAME="Name" ADMIN_PASSWORD=secret npm run admin:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const db = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@qlothe.in").trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Priyansh Rana";

  const existing = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });

  if (existing) {
    const user = await db.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });
    console.log("Account already existed — promoted to ADMIN (password left untouched):");
    console.log(`  id:    ${user.id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  name:  ${user.name}`);
    console.log("\nSign in with the password this account already has, then visit /admin.");
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: { email, name, passwordHash, role: "ADMIN" },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("New admin account created:");
  console.log(`  id:       ${user.id}`);
  console.log(`  email:    ${user.email}`);
  console.log(`  password: ${password}`);
  console.log(`  name:     ${user.name}`);
  console.log("\nThis password is shown once and not stored anywhere in plaintext.");
  console.log("Sign in at /login, then visit /admin. Change the password afterward.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
