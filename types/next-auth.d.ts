import type { DefaultSession } from "next-auth";

// Module augmentation: expose id + role on the session/JWT, matching the
// `Role` enum in prisma/schema.prisma. Keeps lib/auth.ts's getUserId /
// requireAdmin type-safe without `any`.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "CUSTOMER" | "ADMIN";
  }
}

// next-auth/jwt.d.ts only re-exports `@auth/core/jwt` (`export * from ...`),
// so augmenting "next-auth/jwt" would not merge with the real JWT interface —
// the augmentation has to target the module it's actually declared in.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "ADMIN";
  }
}
