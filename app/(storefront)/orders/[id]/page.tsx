import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { OrderStatus } from "@/components/order-status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) redirect(`/login?next=/orders/${params.id}`);
  return (
    <Suspense>
      <OrderStatus orderId={params.id} />
    </Suspense>
  );
}
