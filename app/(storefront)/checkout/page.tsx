import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { CheckoutClient } from "@/components/checkout-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/checkout");
  return <CheckoutClient />;
}
