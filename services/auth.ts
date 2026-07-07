import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const BCRYPT_ROUNDS = 12;

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type AuthUser = { id: string; email: string; name: string | null; role: "CUSTOMER" | "ADMIN" };

export async function registerUser(email: string, password: string, name?: string): Promise<AuthUser> {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AuthError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await db.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}

/** Used by the Credentials provider's authorize() callback. Returns null on any failure — never throws. */
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) return null; // OAuth-only account, no password to check

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
