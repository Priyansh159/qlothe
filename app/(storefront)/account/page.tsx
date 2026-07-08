import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getProfile } from "@/services/profile";
import { AccountForm } from "@/components/account-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/account");

  const profile = await getProfile(userId);

  return (
    <div className="animate-qfade">
      <div className="mx-auto w-full max-w-[640px] px-[18px] pb-16 pt-7 md:px-12 md:pt-10">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-forest/50">
          / Account
        </div>
        <h1 className="mb-8 font-serif text-[32px] font-semibold uppercase tracking-[.005em] text-forest md:text-[42px]">
          My profile
        </h1>
        <Suspense>
          <AccountForm initial={profile} />
        </Suspense>
      </div>
    </div>
  );
}
