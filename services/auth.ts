import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

const BCRYPT_ROUNDS = 12;

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  mustChangePassword: boolean;
};

export async function registerUser(email: string, password: string, name?: string): Promise<AuthUser> {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AuthError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await db.user.create({
    data: { email, passwordHash, name }, // role defaults to CUSTOMER — public registration can never create staff
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true },
  });
  return user;
}

/** Used by the Credentials provider's authorize() callback. Returns null on any failure — never throws. */
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, mustChangePassword: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) return null; // OAuth-only account, no password to check

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Self-service password change — used by the forced-change flow for staff
 * accounts created with a temp password (see services/admin.ts
 * createStaffUser), but works for any signed-in user. Clears
 * mustChangePassword. The caller (route) signs the user out afterward so the
 * next sign-in bakes a fresh JWT — role/mustChangePassword are only read at
 * sign-in time (see lib/auth.ts's jwt callback), never hot-patched mid-session.
 */
export async function changeOwnPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
}
