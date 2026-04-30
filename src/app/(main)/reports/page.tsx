import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ReportsClient } from "./ReportsClient";

const ReportsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Financial Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate balance sheets, income/expense summaries, and defaulter lists.
        </p>
      </div>
      <ReportsClient />
    </div>
  );
};

export default ReportsPage;


