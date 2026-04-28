import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResidentPaymentsClient from "./ResidentPaymentsClient";

const ResidentPaymentsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Payments</h1>
        <p className="text-sm text-muted-foreground">
          View your payment history and pay outstanding bills.
        </p>
      </div>
      <ResidentPaymentsClient />
    </div>
  );
};

export default ResidentPaymentsPage;
