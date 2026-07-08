import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Module augmentation: expose id + role (+ mustChangePassword) on the
// session/JWT, sourced from the Role enum in prisma/schema.prisma so the
// two never drift. Keeps lib/auth.ts's getUserId / requireAdmin and
// lib/rbac.ts's requireRole type-safe without `any`.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    mustChangePassword?: boolean;
  }
}

// next-auth/jwt.d.ts only re-exports `@auth/core/jwt` (`export * from ...`),
// so augmenting "next-auth/jwt" would not merge with the real JWT interface —
// the augmentation has to target the module it's actually declared in.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    mustChangePassword: boolean;
  }
}
