import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { StaffCreateForm } from "@/components/admin/staff-create-form";

export const metadata = { title: "New staff account · Admin" };

export default async function NewStaffPage() {
  await requireRole("ADMIN");
  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All users
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">New staff account</h1>
      <StaffCreateForm />
    </div>
  );
}
