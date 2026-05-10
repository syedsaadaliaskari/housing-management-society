import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StaffClient } from "./StaffClient";

const StaffPage = async () => {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Staff & Vendors
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage domestic staff, drivers, and third-party vendors.
        </p>
      </div>
      <StaffClient />
    </div>
  );
};

export default StaffPage;
