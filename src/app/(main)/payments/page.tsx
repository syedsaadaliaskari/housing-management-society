import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PaymentsClient } from "./PaymentsClient";

const PaymentsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Review payments received against maintenance and utility bills.
        </p>
      </div>
      <PaymentsClient />
    </div>
  );
};

export default PaymentsPage;

