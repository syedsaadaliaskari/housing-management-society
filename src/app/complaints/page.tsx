import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ComplaintsClient } from "./ComplaintsClient";

const ComplaintsPage = async () => {
  const session = await auth();

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Complaints &amp; Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Track maintenance requests, complaints, and their resolution status.
        </p>
      </div>
      <ComplaintsClient />
    </div>
  );
};

export default ComplaintsPage;


