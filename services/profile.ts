import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmailChangeConfirmation } from "@/services/email";
import type { z } from "zod";
import type { profileUpdateSchema } from "@/lib/validation";

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

class ProfileError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const EMAIL_CHANGE_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function getProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, pendingEmail: true, name: true, phone: true,
      role: true, createdAt: true, passwordHash: true,
    },
  });
  if (!user) throw new ProfileError("Not found", 404);
  const { passwordHash, ...rest } = user;
  return { ...rest, hasPassword: passwordHash !== null };
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  if (input.phone) {
    const existing = await db.user.findUnique({ where: { phone: input.phone }, select: { id: true } });
    if (existing && existing.id !== userId) {
      throw new ProfileError("That phone number is already in use on another account", 409);
    }
  }
  return db.user.update({
    where: { id: userId },
    data: { name: input.name, phone: input.phone },
    select: { id: true, email: true, name: true, phone: true },
  });
}

/**
 * Step 1 of 2: stores the requested address as `pendingEmail` (NOT `email` —
 * that only changes once the link is actually clicked) and emails a
 * confirmation link. Reuses the VerificationToken table Auth.js already
 * expects to exist, keyed by userId so a second request simply replaces the
 * first pending one.
 */
export async function requestEmailChange(userId: string, newEmail: string) {
  const current = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!current) throw new ProfileError("Not found", 404);
  if (current.email === newEmail) {
    throw new ProfileError("That's already your current email", 400);
  }

  const existing = await db.user.findUnique({ where: { email: newEmail }, select: { id: true } });
  if (existing) throw new ProfileError("That email is already in use on another account", 409);

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);
  const confirmUrl = `${process.env.APP_URL}/api/account/email/confirm?token=${token}`;

  // Send BEFORE persisting anything: if this throws (e.g. email isn't
  // configured), we must not leave pendingEmail/a token sitting in the DB for
  // a link the user was never actually sent — that's a dead end they can
  // never confirm their way out of.
  await sendEmailChangeConfirmation(newEmail, confirmUrl);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } }),
    // Identifier = userId, so a repeat request cleanly replaces the old token
    // instead of leaving two live tokens for the same pending change.
    db.verificationToken.deleteMany({ where: { identifier: userId } }),
    db.verificationToken.create({ data: { identifier: userId, token, expires } }),
  ]);
}

/** Step 2 of 2: the link handler. Returns the new email on success, for a friendly confirmation message. */
export async function confirmEmailChange(token: string): Promise<{ email: string }> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    if (record) await db.verificationToken.delete({ where: { token } }).catch(() => {});
    throw new ProfileError("This link is invalid or has expired", 400);
  }

  const userId = record.identifier;
  const user = await db.user.findUnique({ where: { id: userId }, select: { pendingEmail: true } });
  if (!user?.pendingEmail) {
    throw new ProfileError("No email change is pending for this link", 400);
  }

  // Someone else could have claimed the address in the meantime.
  const clash = await db.user.findFirst({
    where: { email: user.pendingEmail, id: { not: userId } },
    select: { id: true },
  });
  if (clash) throw new ProfileError("That email is already in use on another account", 409);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { email: user.pendingEmail, pendingEmail: null } }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  return { email: user.pendingEmail };
}
