import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BillingClient } from "./BillingClient";

const BillingPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Maintenance &amp; Utility Bills
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate and manage recurring bills for all units.
        </p>
      </div>
      <BillingClient />
    </div>
  );
};

export default BillingPage;


