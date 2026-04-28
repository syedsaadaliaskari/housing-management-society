import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResidentBillsClient from "./ResidentBillsClient";

const ResidentBillsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Bills</h1>
        <p className="text-sm text-muted-foreground">
          View all your maintenance and utility bills.
        </p>
      </div>
      <ResidentBillsClient />
    </div>
  );
};

export default ResidentBillsPage;
