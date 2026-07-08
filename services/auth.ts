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
 * Used ONLY by the forced-change flow for staff accounts created with a temp
 * password (see services/admin.ts createStaffUser) — deliberately skips the
 * current-password check, since the whole point is that they're mid-onboarding
 * off a password they were just handed, not proving ownership of an
 * established one. Clears mustChangePassword. The caller (route) signs the
 * user out afterward so the next sign-in bakes a fresh JWT —
 * role/mustChangePassword are only read at sign-in time (see lib/auth.ts's
 * jwt callback), never hot-patched mid-session.
 */
export async function changeOwnPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
}

/**
 * General-purpose self-service password change for the account settings
 * page. Unlike changeOwnPassword() above, this verifies the current password
 * FIRST whenever one exists — a live session should never be enough on its
 * own to permanently lock the real owner out. OAuth-only accounts (no
 * passwordHash yet) are the one exception: there's nothing to "confirm", so
 * this doubles as "set a password for the first time."
 */
export async function changePasswordVerified(
  userId: string,
  currentPassword: string | undefined,
  newPassword: string,
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new AuthError("Not found", 404);

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new AuthError("Enter your current password", 400);
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AuthError("Current password is incorrect", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false } });
}
