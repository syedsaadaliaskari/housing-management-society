import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ResidentDashboardClient } from "./ResidentDashboardClient";

const ResidentDashboardPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "RESIDENT") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          My Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          View your payments, complaints, polls, and emergency alerts.
        </p>
      </div>
      <ResidentDashboardClient />
    </div>
  );
};

export default ResidentDashboardPage;

