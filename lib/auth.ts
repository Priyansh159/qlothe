import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { CredentialsSignin } from "next-auth";
import { db } from "@/lib/db";
import { mergeGuestCart } from "@/services/cart";
import { verifyCredentials } from "@/services/auth";
import { rateLimit, loginLimiter, clientIp } from "@/lib/rate-limit";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

/**
 * Single choke point for auth. Everything else in the app calls
 * getUserId / requireUserId / requireAdmin / getCartToken from HERE only.
 *
 * Session strategy is JWT, not "database": the Credentials provider is
 * incompatible with database sessions (Auth.js constraint), so the adapter
 * is used only for user/account persistence (registration + Google linking).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  // Trust the Host/X-Forwarded-Host header. Vercel sets this implicitly;
  // required for local `next start` and any self-hosted deployment.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const { success } = await rateLimit(loginLimiter, clientIp(request));
        if (!success) throw new RateLimitedSignin();

        const user = await verifyCredentials(email, password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google-verified emails are trusted to link to an existing
      // credentials account with the same address, so a customer who
      // registered with a password can also sign in with Google.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Fold the guest cart (cookie-keyed) into the user's cart on login.
      // Only merge if the cookie actually points at an anonymous cart —
      // never at another user's cart (e.g. a stale cookie from a prior session).
      if (user.id) {
        const cartToken = await getCartToken();
        if (cartToken) {
          const guestCart = await db.cart.findUnique({
            where: { id: cartToken },
            select: { userId: true },
          });
          if (guestCart && guestCart.userId === null) {
            await mergeGuestCart(cartToken, user.id);
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user.role ?? "CUSTOMER") as "CUSTOMER" | "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return id;
}

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  if (session.user.role !== "ADMIN") throw Object.assign(new Error("Forbidden"), { status: 403 });
  return session.user.id;
}

/** Guest cart id lives in an httpOnly cookie. */
export async function getCartToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get("qlothe_cart")?.value;
}
